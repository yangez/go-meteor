Meteor.publish('yourActiveGames', function() {
  return Games.find({
    $and: [
      { archived: {$exists: false }},
      { $or: [ {whitePlayerId: this.userId}, {blackPlayerId: this.userId} ] }
    ]
  });
});

Meteor.publish('latestGame', function() {
  return Games.find({}, {limit: 1});
})
Meteor.publish('latestFinishedGames', function() {
  // return Games.find({limit: 10});
  return Games.find({
    $or: [{archived: "resigned"}, {archived: "finished"}]
  },{limit: 10});
});

Meteor.publish('specificGame', function(id) {
  return Games.find({_id: id});
});

Meteor.publish('gamesOfUser', function(username) {
  check(username, String)
  var user = Meteor.users.findOne({username: username});
  if (user) {
    return Games.find({ $or: [ {whitePlayerId: user._id}, {blackPlayerId: user._id} ] });
  }
})

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
