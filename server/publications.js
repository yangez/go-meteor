Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish("allUsers", function () {
  return Meteor.users.find();
});
