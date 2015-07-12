
Template.gamePage.helpers({
  messages: function(){
    return this.messages;
  }


});

Template.gamePage.events({
  'submit #comment-form': function(e) {
    e.preventDefault();

    messages = this.messages;

    if (!messages) messages = [];

    messages.push({
      author: Meteor.user().username,
      content: $(e.target).find('[name=content]').val(),
    });

    Games.update({_id: this._id}, {$set: {messages: messages}});

    $(e.target).find('[name=content]').val("");
  }
});

