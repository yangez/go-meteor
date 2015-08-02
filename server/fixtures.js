if (Rooms.find().count() === 0) {
  Room.create({
    name: 'Global',
    type: 'chatroom'
  })
}
