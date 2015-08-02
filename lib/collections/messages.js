Messages = new Mongo.Collection('messages', {
  transform: function(doc) {
    var message = new Message(doc);
    return message;
  }
});