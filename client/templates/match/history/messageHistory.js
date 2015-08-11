Template.messageHistory.onRendered(function(){
  scrollInGameMessages(0);
});

Template.messageHistory.helpers({
  messages: function(){
    var currentMove = Session.get("currentMove");
    if (currentMove !== undefined) {
      var moveNumber = currentMove + 1;
      return this.getMessagesBeforeMove(moveNumber);
    }
  },
  inGameMessageScroller: function() {
    if (Session.get("currentMove")) scrollInGameMessages();
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
