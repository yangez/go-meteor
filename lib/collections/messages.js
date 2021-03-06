/*
# Message
- createdAt
- roomId
- senderId
- content
- meta (object containing metadata)
*/

Messages = new Mongo.Collection('messages');

createMessage = function(messageObj) {

  var room = Rooms.findOne(messageObj.roomId);
  if (!room) throw new Meteor.Error('This room does not exist!');

  var user = Meteor.userId();
  if (!user && !messageObj.meta.type) throw new Meteor.Error('User not logged in.');

  var message = {
    senderId: Meteor.userId(),
    content: messageObj.content,
    createdAt: new Date(),
    roomId: room._id,
    meta: messageObj.meta
  }

  return Messages.insert(message);
}

Messages.helpers({
  updateMeta: function(obj) {
    var set = {};

    _.forOwn(obj, function(value, key) {
      set["meta."+key] = value;
    });

    Messages.update({_id: this._id}, {$set: set });
  },
});
