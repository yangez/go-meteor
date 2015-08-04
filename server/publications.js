Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish("allUsers", function () {
  return Meteor.users.find({}, {
    fields: { meta: 1, profile: 1, username: 1, _id: 1}
  });
});

Meteor.publish('userPresence', function() {
  var filter = { userId: { $exists: true }};

  return Presences.find(filter, {
    fields: { state: true, userId: true }
  });
});

Meteor.publish('rooms', function(){
  return Rooms.find();
})

Meteor.publish('messages', function(){
  return Messages.find();
});

Meteor.publish('challenges', function() {
  return Challenges.find({ $and: [
    // current user is either sender or recipient
    { $or: [
      { senderId: this.userId },
      { recipientId: this.userId },
    ] },

    // challenge is pending
    { acknowledged: {$exists: false} },
    { declined: {$exists: false} },
    { canceled: {$exists: false} },
  ] });
});
