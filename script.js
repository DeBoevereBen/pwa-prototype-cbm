import { DataModule } from "./DataModule.js";

(function() {
  const SWversion = "1";

  const DB = new DataModule(1);

  const API_BASE = "https://hhot.cbm.org/apiv2/";
  const API_TASKCARD_ROOT = API_BASE + "en/taskcards/";

  const CONFIG = {
    method: `GET`,
    headers: {
      "Content-Type": `application/json`,
      "Access-Control-Allow-Origin": `*`
    }
  };

  async function displayCards() {
    let cardsByTopic = await DB.getTopicsWithCards();

    const topicSelect = document.getElementById("topicSelect");

    Object.keys(cardsByTopic).forEach(topic => {
      const topicOption = document.createElement("option");
      topicOption.value = topic;
      topicOption.text = topic;
      topicSelect.appendChild(topicOption);
    });
    onSelectChange();
  }

  async function onSelectChange() {
    let cardsByTopic = await DB.getTopicsWithCards();

    const cardSelect = document.getElementById("cardSelect");
    cardSelect.innerHTML = "";
    const topic = document.getElementById("topicSelect").value;

    cardsByTopic[topic].forEach(card => {
      const topicOption = document.createElement("option");
      topicOption.value = card.slug;
      topicOption.text = card.title;
      cardSelect.appendChild(topicOption);
    });
    showCardsInfo();
  }

  async function getCardDetails(card_slug) {
    let details = null;

    if (details === null) {
      details = await DB.fetch(`${API_TASKCARD_ROOT}${card_slug}/`);
    } else {
      details = JSON.parse(details);
    }

    return details;
  }

  function getCardHtml(taskcard) {
    let content = `<h1>${taskcard.title}</h1><br>`;
    taskcard.content.forEach(function(contentBlock) {
      if (contentBlock.type == "image") {
        content = content + `<img src="${contentBlock.value}">`;
      } else {
        content = content + contentBlock.value;
      }
    });
    return content;
  }

  async function showCardFromHistory(slug) {
    const cardDetails = await DB.getCardDetailNetworkFirst(slug);
    updateCardDetailHtml(cardDetails);
  }

  async function updateHistory(slug, title) {
    await DB.saveHistory(slug, title);
    let historyList = await DB.getHistory();
    const historyElement = document.getElementById("history");
    historyElement.innerHTML = "";

    historyList.forEach(history => {
      const p = document.createElement("p");
      p.addEventListener("click", e => {
        showCardFromHistory(history.slug);
      });
      p.innerHTML = `<a href="#">${history.title}</a>`;
      historyElement.prepend(p);
    });
  }

  function updateCardDetailHtml(cardDetails) {
    const taskcardDetails = document.getElementById("taskcard_details");
    taskcardDetails.innerHTML = getCardHtml(cardDetails);
  }

  async function showCardsInfo() {
    const slug = document.getElementById("cardSelect").value;
    let cardDetails = await DB.getCardDetailNetworkFirst(slug);
    updateCardDetailHtml(cardDetails);
    updateHistory(slug, cardDetails.title);
  }

  (function registerServiceWorker() {
    window.isUpdateAvailable = new Promise(function(resolve, reject) {
      // lazy way of disabling service workers while developing
      if ("serviceWorker" in navigator) {
        // register service worker file
        navigator.serviceWorker
          .register("service-worker.js")
          .then(reg => {
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              installingWorker.onstatechange = () => {
                switch (installingWorker.state) {
                  case "installed":
                    if (navigator.serviceWorker.controller) {
                      // new update available
                      resolve(true);
                    } else {
                      // no update available
                      resolve(false);
                    }
                    break;
                }
              };
            };
          })
          .catch(err => console.error("[SW ERROR]", err));
      }
    });

    window.isUpdateAvailable.then(isAvailable => {
      if (isAvailable) {
        alert("new update available, refresh to view newest content.");
      }
    });
  })();

  document.addEventListener("DOMContentLoaded", async function() {
    console.log("Ready");
    document
      .getElementById("cardSelect")
      .addEventListener("change", async e => await showCardsInfo());
    document
      .getElementById("topicSelect")
      .addEventListener("change", async e => await onSelectChange());
    displayCards();
    DB.checkForNewCardsAndSave();
  });
})();
