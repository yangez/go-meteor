Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish("allUsers", function () {
  return Meteor.users.find({}, {
    fields: { profile: 1, username: 1, _id: 1}
  });
});

Meteor.publish('userPresence', function() {
  var filter = { userId: { $exists: true }};

  return Presences.find(filter, {
    fields: { state: true, userId: true }
  });
});

Meteor.publish('chatroom', function(){
  return Chatrooms.find();
})

Meteor.publish('challenges', function() {
  return Challenges.find({ $and: [
    // current user is either sender or recipient
    { $or: [
      { senderId: this.userId },
      { recipientId: this.userId },
    ] },

    // challenge is pending
    { acceptedAt: {$exists: false} },
    { declined: {$exists: false} },
    { canceled: {$exists: false} },
  ] });
});
