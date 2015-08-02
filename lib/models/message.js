/*
# Message
- createdAt
- roomId
- senderId
- content
*/

Message = function(doc) {
  _.extend(this, doc);
};

Message.create = function(roomId, content) {
  var room = Rooms.findOne(roomId);
  if (room && Meteor.userId()) {
    var message = {
      senderId: Meteor.userId(),
      content: content,
      createdAt: new Date(),
      roomId: roomId
    }

    return Messages.insert(message);
  } else {
    throw new Meteor.Error('This room does not exist!');
  }
}

_.extend(Message.prototype, {

});
