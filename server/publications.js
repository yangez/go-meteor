Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish("allUsers", function () {
  return Meteor.users.find({}, {
    fields: { meta: 1, profile: 1, username: 1, _id: 1, ratings: 1}
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

Meteor.publish('positions', function(){
  return Positions.find();
});

// add challenge Herald publications
// this adds on to default Herald publication here:
// https://github.com/Meteor-Reaction/Herald/blob/d057a2b1f7e92603f89066cd2880f9edf652b86b/server/publish.js
Meteor.publish('challenges', function() {
  return Herald.collection.find({ $and: [
    // current user is either sender or recipient of this challenge
    { courier: "challengeNew" },
    { $or: [
      { "data.senderId": this.userId },
      { "data.recipientId": this.userId },
    ] },
  ] });
});
