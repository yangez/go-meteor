Template.messageHistory.onRendered(function(){
  scrollMessages(0);
});

Template.messageHistory.helpers({
  messages: function(){
    if (Session.get("historyMoveIndex")) {
      var moveNumber = Session.get("historyMoveIndex").current+1;
      return this.getMessagesBeforeMove(moveNumber);
    }
  },
  inGameMessagesVisible: function() {
    return Session.get("messageHistoryState") === "ingame" ? "" : "hidden";
  },
  isInGameMessages: function() {
    return true; // for message template to see
  }
});

var scrollMessages = function(speed) {
  if ($("#game-ingame-messages").length > 0) {
    $("#game-ingame-messages").animate({scrollTop:$("#game-ingame-messages")[0].scrollHeight}, speed);
  }
}
