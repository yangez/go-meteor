Meteor.publish('games', function() {
  return Games.find();
});
