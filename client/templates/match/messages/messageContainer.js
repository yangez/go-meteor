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

    if (!Meteor.userId()) return false;

    var content = $(e.target).find('[name=content]').val();
    if (!content) return false;

    this.pushMessage(content, Meteor.user());

    $(e.target).find('[name=content]').val("");
  },
});

var scrollMessages = function(speed) {
  if ($("#game-live-messages").length > 0) {
    $("#game-live-messages").animate({scrollTop:$("#game-live-messages")[0].scrollHeight}, speed);
  }
}
