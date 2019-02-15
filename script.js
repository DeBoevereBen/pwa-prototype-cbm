import { DataModule } from "./DataModule.js";
import { DOMModule } from "./DOMModule.js";

(function() {
  const DBVersion = 6;

  const DOM = new DOMModule();
  const DB = new DataModule(DBVersion, DOM);

  async function displayCards() {
    let cardsByTopic = await DB.getTopicsWithCards();
    DOM.updateTopicSelect(cardsByTopic);

    await onSelectChange(cardsByTopic);
  }

  async function onSelectChange(cardsByTopic) {
    if (!cardsByTopic) cardsByTopic = await DB.getTopicsWithCards();
    DOM.updateCardSelect(cardsByTopic);
    await showCardsDetail();
  }

  async function updateHistory(slug, title) {
    await DB.saveHistory(slug, title);
    let historyList = await DB.getHistory();
    DOM.updateHistory(historyList, showCardDetailFromHistory);
  }

  async function showCardDetailFromHistory(slug) {
    const cardDetails = await DB.getCardDetail(slug);
    DOM.updateCardDetails(cardDetails);
  }

  async function showCardsDetail(isRefresh) {
    const slug = DOM.getSelectedCard();
    let cardDetails = await DB.getCardDetail(slug, isRefresh);
    DOM.updateCardDetails(cardDetails);
    if (!isRefresh) updateHistory(slug, cardDetails.title);
  }

  async function refreshCardDetail() {
    await showCardsDetail(true);
    DOM.hideReloadButton();
  }

  (function registerServiceWorker() {
    window.isUpdateAvailable = new Promise(function(resolve, reject) {
      let refreshing;
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
          navigator.serviceWorker.addEventListener("controllerchange", _ => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
          })
      }
    });

    window.isUpdateAvailable.then(isAvailable => {
      if (isAvailable) {
        console.log("update available");
        // alert("new update available, refresh to view newest content.");
      }
    });
  })();

  document.addEventListener("DOMContentLoaded", function() {
    document
      .getElementById("cardSelect")
      .addEventListener("input", async e => await showCardsDetail());
    document
      .getElementById("topicSelect")
      .addEventListener("input", async e => await onSelectChange());
    document
      .getElementById("reload")
      .addEventListener("click", async e => await refreshCardDetail());
    displayCards();
    DB.checkForNewCardsAndSave();
  });
})();
