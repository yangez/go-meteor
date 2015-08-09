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
  }else{
    var newRoom = {
      name: name,
      type: roomAttributes.type,
      users: roomAttributes.users
    }
    return Rooms.insert(newRoom);
  }
}

findPrivateRoom = function(user1, user2){
  return Rooms.findOne({
          $and: [
            { users : {$in : [user1._id]} },
            { users : {$in : [user2._id]} },
            { type : 'pm' }
          ]
  });
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
