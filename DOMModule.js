export const DOMModule = (function() {
  const topicSelect = document.getElementById("topicSelect");
  const cardSelect = document.getElementById("cardSelect");
  const taskcardDetails = document.getElementById("taskcard_details");
  const reloadBtn = document.getElementById("reload");
  const favList = document.getElementById("favouriteList");
  const filteredCardsSelect = document.getElementById("filteredCards");

  const DOMModule = function() {};

  DOMModule.prototype.showReloadButton = function() {
    reloadBtn.style = "display: inline";
  };

  DOMModule.prototype.updateFavStar = function(state) {
    const favBtn = document.getElementById("favBtn");
    favBtn.dataset.state = !state;
    if (state) {
      favBtn.classList.replace("fas", "far");
    } else {
      favBtn.classList.replace("far", "fas");
    }
  };

  DOMModule.prototype.hideReloadButton = function() {
    reloadBtn.style = "display: none";
  };

  DOMModule.prototype.updateCardSelect = function(cardsByTopic) {
    cardSelect.innerHTML = "";
    const topic = topicSelect.value;

    cardsByTopic[topic].forEach(card => {
      const topicOption = document.createElement("option");
      topicOption.value = card.slug;
      topicOption.text = card.title;
      cardSelect.appendChild(topicOption);
    });
  };

  function getCardHtml(slug, taskcard) {
    let icon = taskcard.isFavourite ? `s` : `r`;
    let content = `<h1>${
      taskcard.title
    } <i id='favBtn' data-slug="${slug}" data-state="${
      taskcard.isFavourite
    }"  class="fa${icon} fa-star" style="color:yellow;"></i></h1><br />`;
    taskcard.content.forEach(function(contentBlock) {
      if (contentBlock.type == "image") {
        content = content + `<img src="${contentBlock.value}">`;
      } else {
        content = content + contentBlock.value;
      }
    });
    return content;
  }

  DOMModule.prototype.getSelectedCard = function() {
    return cardSelect.value;
  };

  DOMModule.prototype.updateCardDetails = function(slug, taskcard) {
    taskcardDetails.innerHTML = getCardHtml(slug, taskcard);
  };

  DOMModule.prototype.updateTopicSelect = function(cardsByTopic) {
    Object.keys(cardsByTopic).forEach(topic => {
      const topicOption = document.createElement("option");
      topicOption.value = topic;
      topicOption.text = topic;
      topicSelect.appendChild(topicOption);
    });
  };

  DOMModule.prototype.showFavouriteList = function(favourites, showCardDetailFromFavourites) {
    favList.innerHTML = "";

    if (favourites.length === 0) {
      favList.innerHTML = "<li>Add some favourites to your list</li>";
      return;
    }

    favourites.forEach(favourite => {
      const li = document.createElement("li");
      li.addEventListener("click", e => {
        showCardDetailFromFavourites(favourite.slug);
      });
      li.innerHTML = `<a href="#">${favourite.slug}</a>`;
      favList.append(li);
    });
  };

  DOMModule.prototype.updateFilteredCards = function (cards) {
    filteredCardsSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.selected = "selected";
    defaultOption.text = "Make a choice...";
    defaultOption.disabled = "disabled";
    filteredCardsSelect.appendChild(defaultOption);
    Object.keys(cards).forEach(card => {
      console.log(card);
      const option = document.createElement("option");
      option.value = card;
      option.text = cards[card];
      filteredCardsSelect.appendChild(option);
    })

  }

  return DOMModule;
})();
