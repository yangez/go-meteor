Template.messageContainer.onRendered(function(){
  scrollMessages(0);
});

Template.messageContainer.helpers({
  messageScroller: function() {
    if (this.messages) scrollMessages();
  },
  messages: function(){
    return this.messages;
  },
  gameEnded: function() {
    return this.archived;
  },
});

Template.messageContainer.events({
  'click .messages-container': function(e) {
    $("#comment-form input[type=text]").focus();
  },
  'submit #comment-form': function(e) {
    e.preventDefault();

    var game = this;
    var $input = $(e.target).find('[name=content]');
    var content = $input.val();

    Meteor.call('game/message', game._id, content, function(error, result) {
      if (error) return console.log(error.reason);
    });

    if (Session.get("messageHistoryState") === "ingame" && $("#chat-live")) {
      $("#chat-live").click();
      $input.focus();
    }

    $input.val("");
  },
});

var scrollMessages = function(speed) {
  if ($("#game-live-messages").length > 0) {
    $("#game-live-messages").animate({scrollTop:$("#game-live-messages")[0].scrollHeight}, speed);
  }
}
