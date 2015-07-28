Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish("allUsers", function () {
  return Meteor.users.find({}, {fields: { profile: 1, username: 1, _id: 1} });
});

Meteor.publish('userPresence', function() {
  // If for example we wanted to publish only logged in users we could apply:
  var filter = { userId: { $exists: true }};

  return Presences.find(filter, { fields: { state: true, userId: true }});
});

Meteor.publish('chatroom', function(){
  return Chatrooms.find();
})
