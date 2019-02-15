export const DOMModule = (function() {
  const topicSelect = document.getElementById("topicSelect");
  const cardSelect = document.getElementById("cardSelect");
  const historyElement = document.getElementById("history");
  const taskcardDetails = document.getElementById("taskcard_details");
  const reloadBtn = document.getElementById("reload");

  const DOMModule = function (){};

  DOMModule.prototype.showReloadButton = function () {
    reloadBtn.style = "display: inline";
  }

  DOMModule.prototype.hideReloadButton = function () {
    reloadBtn.style = "display: none";
  }

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

  DOMModule.prototype.getSelectedCard = function () {
    return cardSelect.value;
  }

  DOMModule.prototype.updateCardDetails = function(taskcard) {
    taskcardDetails.innerHTML = getCardHtml(taskcard);
  };

  DOMModule.prototype.updateHistory = function(historyList, showCardDetailFromHistory) {
    historyElement.innerHTML = "";

    historyList.forEach(history => {
      const p = document.createElement("p");
      p.addEventListener("click", e => {
        showCardDetailFromHistory(history.slug);
      });
      p.innerHTML = `<a href="#">${history.title}</a>`;
      historyElement.prepend(p);
    });
  };

  DOMModule.prototype.updateTopicSelect = function (cardsByTopic) {
    Object.keys(cardsByTopic).forEach(topic => {
      const topicOption = document.createElement("option");
      topicOption.value = topic;
      topicOption.text = topic;
      topicSelect.appendChild(topicOption);
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
  });

  return DOMModule;

})();

