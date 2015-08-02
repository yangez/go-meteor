Meteor.methods({
  'rooms/addMessage': function(roomId, content) {
    var room = Rooms.findOne(roomId);

    room.addMessage(content);
  }
})
