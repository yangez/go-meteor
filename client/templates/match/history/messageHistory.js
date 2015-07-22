Template.messageHistory.onRendered(function(){
  scrollMessages(0);
});

Template.messageHistory.helpers({
  messageScroller: function() {
    if (this.messages) scrollMessages();
  },
  messages: function(){
    if (Session.get("historyMoveIndex")) {
      var moveNumber = Session.get("historyMoveIndex").current+1;
      return this.getMessagesBeforeMove(moveNumber);
    }
  },
  gameEnded: function() {
    return this.archived;
  },
  inGameMessagesVisible: function() {
    return Session.get("messageHistoryState") === "ingame" ? "" : "hidden";
  },
});

Template.messageContainer.events({
  'click .messages-container': function(e) {
    $("#comment-form input[type=text]").focus();
  },
  'submit #comment-form': function(e) {
    e.preventDefault();

    if (!Meteor.userId()) return false;

    var content = $(e.target).find('[name=content]').val();
    if (!content) return false;

    this.pushMessage(content, Meteor.user());

    $(e.target).find('[name=content]').val("");
  },
});

/*
var allGameMessages = function() {
  return _.filter(this.messages, function(m) { return m.currentMove; });
}
*/

var scrollMessages = function(speed) {
  if ($("#game-ingame-messages").length > 0) {
    $("#game-ingame-messages").animate({scrollTop:$("#game-ingame-messages")[0].scrollHeight}, speed);
  }
}
