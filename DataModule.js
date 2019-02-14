export const DataModule = (function() {
  // const API_BASE = "https://hhot.cbm.org/apiv2/";
  const API_BASE = "https://cbmtje.herokuapp.com/apiv2/";
  const API_TASKCARD_ROOT = API_BASE + "en/taskcards/";

  const DBKey = "CBM";

  const FetchConf = {
    method: `GET`,
    mode: "cors",
    headers: {
      "Accept": "application/json",
      "Content-Type": `application/json`
    }
  };

  const DataModule = function(version) {
    this.version = version;
    this.DB = idb.openDb(DBKey, this.version, upgradeDB => {
      upgradeDB.createObjectStore("topics", { keyPath: "name" });
      upgradeDB.createObjectStore("cardDetails", { keyPath: "slug" });
      upgradeDB.createObjectStore("history", { keyPath: "time" });
    });
  };

  DataModule.prototype.fetch = async function(url) {
    console.log("Fetching the network");
    const result = await fetch(url, FetchConf);
    try {
      return await result.json();
    } catch (err) {
      console.log("something went wrong in the fetchHelper");
      console.error(err);
      return null;
    }
  };

  DataModule.prototype.getTopicsWithCards = async function() {
    try {
      try {
        return await getCardsByTopicFromCache.call(this);
      } catch (e) {
        const data = await this.fetch(API_TASKCARD_ROOT);
        const cardsByTopic = groupByTopic(data);
        this.saveTopicsWithCards(cardsByTopic);
        return cardsByTopic;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCardsByTopicFromCache = async function() {
    return await this.DB.then(db => {
      return db
        .transaction("topics")
        .objectStore("topics")
        .getAll();
    })
      .then(topics => {
        if (topics.length <= 0) {
          throw new Error("No topics found in cache...");
        }
        const newTopicObj = {};
        topics.forEach(topic => {
          newTopicObj[topic.name] = topic.cards;
        });
        return newTopicObj;
      })
      .catch(err => {
        console.log(err);
        throw new Error("Something went wrong...");
      });
  };

  const groupByTopic = taskcards => {
    const cardsByTopic = {};
    taskcards.forEach(card => {
      card.field_tags.forEach(topic => {
        if (cardsByTopic[topic]) {
          cardsByTopic[topic].push(card);
        } else {
          cardsByTopic[topic] = [card];
        }
      });
    });

    return cardsByTopic;
  };

  DataModule.prototype.saveTopicsWithCards = async function(json) {
    const cards = [];
    // console.log(json);
    Object.keys(json).forEach(key => {
      cards.push({
        name: key,
        cards: json[key]
      });
    });

    this.DB.then(db => {
      const tx = db.transaction("topics", "readwrite");
      cards.forEach(card => {
        tx.objectStore("topics").put(card);
      });
      return tx.complete;
    });
  };

  const getCardDetailFromCache = async function(slug) {
    return await this.DB.then(db => {
      return db
        .transaction("cardDetails")
        .objectStore("cardDetails")
        .get(slug);
    })
      .then(cardDetail => {
        // console.log("cardDetail", cardDetail);
        if (!cardDetail) {
          throw new Error("Card not found in cache");
        }
        return cardDetail.details;
      })
      .catch(err => {
        console.log(err);
        throw new Error("Something went wrong...");
      });
  };

/**
 * Network first to ensure newest version of card.
 * Fallback to cache.
 */

  DataModule.prototype.getCardDetailNetworkFirst = async function(cardSlug) { 
    try {
      try {
        const cardDetailFromNetwork = await this.fetch(`${API_TASKCARD_ROOT}${cardSlug}`);
        const cardDetailFromCache = await getCardDetailFromCache.call(this, cardSlug);

        if (cardDetailFromCache.changed !== cardDetailFromNetwork.changed) {
          console.log("Card changed, updating cache...");
          this.saveCardDetail(cardDetailFromNetwork, cardSlug);
        }

        return cardDetailFromNetwork;
      } catch (e) {
        return await getCardDetailFromCache.call(this, cardSlug);
      }
    } catch (e) {
      console.log(e);
    }
  };

  DataModule.prototype.saveCardDetail = async function(details, slug) {
    this.DB.then(db => {
      const tx = db.transaction("cardDetails", "readwrite");
      tx.objectStore("cardDetails").put({
        slug,
        details
      });
      return tx.complete;
    });
  };

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  DataModule.prototype.getHistory = async function() {
    return await this.DB.then(db => {
      return db
        .transaction("history")
        .objectStore("history")
        .getAll();
    }).then(results => {
      return results;
    });
  };

  DataModule.prototype.saveHistory = async function(slug, title) {
    this.DB.then(db => {
      const tx = db.transaction("history", "readwrite");
      tx.objectStore("history").put({
        slug,
        title,
        time: Date.now()
      });
      return tx.complete;
    });
  };

  async function checkIfCardExists(slug) {
    return this.DB.then(db => {
      return db
        .transaction("cardDetails")
        .objectStore("cardDetails")
        .get(slug);
    }).then(card => {
      return card ? false : true;
    })
    .catch(err => {
      console.log("No internet?", err);
    });
  }

  DataModule.prototype.checkForNewCardsAndSave = async function() {
    let cards = null;
    try {
      cards = await this.fetch(API_TASKCARD_ROOT);
      cards = cards.map(x => x.slug);
    } catch (err) {
      console.log("No internet?", err);
      return;
    }

    await asyncForEach(cards, async card => {
      const newOrUpdated = await checkIfCardExists.call(this, card);

      if (newOrUpdated) {
        // save this card
        const detail = await this.fetch(`${API_TASKCARD_ROOT}${card}`);
        await this.saveCardDetail(detail, card);
      } // else skip this card

    });
  };

  return DataModule;
})();
