Messages = new Mongo.Collection('messages', {
  transform: function(doc) {
    var message = new Message(doc);
    return message;
  }
});


Messages.allow({
  update: function() {
    if (Meteor.userId()) return true;
  }
})
