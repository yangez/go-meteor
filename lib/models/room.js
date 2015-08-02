/*
# Room
- name
- type (in-game, pm, global)
*/

Room = function(doc) {
  _.extend(this, doc);
};

Room.create = function(roomAttributes) {
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

_.extend(Room.prototype, {
  addMessage: function(content, meta) {
    return Message.create({
      roomId: this._id,
      content: content,
      meta: meta
    });
  }
});
