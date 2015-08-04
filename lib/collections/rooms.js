/*
# Room
- name
- type (in-game, pm, global)
*/

Rooms = new Mongo.Collection('rooms');

createRoom = function(roomAttributes) {
  var name = roomAttributes.name;
  var room = Rooms.findOne({name: name});
  if (room) {
    return room._id;
  } else {
    var newRoom = {
      name: name,
      type: roomAttributes.type
    }
    return Rooms.insert(newRoom);
  }
}

Rooms.helpers({
  addMessage: function(content, meta) {
    return createMessage({
      roomId: this._id,
      content: content,
      meta: meta
    });
  }
});
