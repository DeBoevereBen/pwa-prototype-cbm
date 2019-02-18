import { DataModule } from "./DataModule.js";
import { DOMModule } from "./DOMModule.js";

(function() {
  const DBVersion = 7;

  const DOM = new DOMModule();
  const DB = new DataModule(DBVersion, DOM);

  async function displayCards() {
    let cardsByTopic = await DB.getTopicsWithCards();
    DOM.updateTopicSelect(cardsByTopic);
    let favourites = await DB.getFavouriteList();
    DOM.showFavouriteList(favourites, showCardDetailFromFavourites);
    await onSelectChange(cardsByTopic);
  }

  async function onSelectChange(cardsByTopic) {
    if (!cardsByTopic) cardsByTopic = await DB.getTopicsWithCards();
    DOM.updateCardSelect(cardsByTopic);
    await showCardsDetail();
  }

  async function showCardsDetail(isRefresh) {
    const slug = DOM.getSelectedCard();
    let cardDetails = await DB.getCardDetail(slug, isRefresh);
    DOM.updateCardDetails(slug, cardDetails);
  }

  async function refreshCardDetail() {
    await showCardsDetail(true);
    DOM.hideReloadButton();
  }

  async function updateFavourite(event) {
    if (event.target && event.target.matches("#favBtn")) {
      const state = JSON.parse(event.target.dataset.state);
      const slug = event.target.dataset.slug;
      if (state) DB.removeFavourite(slug);
      else DB.markFavourite(slug);
      DOM.updateFavStar(state);
    }
    let favourites = await DB.getFavouriteList();
    DOM.showFavouriteList(favourites, showCardDetailFromFavourites);
  }

  async function showCardDetailFromFavourites(slug) {
    const cardDetails = await DB.getCardDetail(slug);
    DOM.updateCardDetails(slug, cardDetails);
  }

  async function searchCards(e) {
    const searchText = e.target.value;
    const cards = await DB.cardsWithText(searchText);
    DOM.updateFilteredCards(cards);
  }

  async function showCardFromSearch(e) {
    const slug = e.target.value;
    showCardDetailFromFavourites(slug);
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
        });
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
    document
      .getElementById("taskcard_details")
      .addEventListener("click", e => updateFavourite(e));
    document
      .getElementById("searchInput")
      .addEventListener("change", e => searchCards(e));
    document
      .getElementById("filteredCards")
      .addEventListener("input", e => showCardFromSearch(e));
    displayCards();
    DB.checkForNewCardsAndSave();
  });
})();
