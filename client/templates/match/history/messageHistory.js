Template.messageHistory.onRendered(function(){
  scrollInGameMessages(0);
});

Template.messageHistory.helpers({
  messages: function(){
    if (Session.get("historyMoveIndex")) {
      var moveNumber = Session.get("historyMoveIndex").current+1;
      return this.getMessagesBeforeMove(moveNumber);
    }
  },
  inGameMessageScroller: function() {
    if (Session.get("historyMoveIndex")) {
      scrollInGameMessages();
      console.log("scrolling");
    };
  },
  inGameMessagesVisible: function() {
    return Session.get("messageHistoryState") === "ingame" ? "" : "background";
  },
});

scrollInGameMessages = function(speed) {
  if ($("#game-ingame-messages").length > 0) {
    $("#game-ingame-messages").animate({scrollTop:$("#game-ingame-messages")[0].scrollHeight}, speed);
  }
}
