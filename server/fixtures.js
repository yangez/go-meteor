if (Rooms.find().count() === 0) {
  createRoom({
    name: 'Global',
    type: 'chatroom'
  })
}
