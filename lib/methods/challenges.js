Meteor.methods({
  // autocomplete function for challenge username
  'challenge/create': function(gameAttributes, challengeUsername) {

    check(Meteor.user(), Object);
    check(gameAttributes, Object);
    var user = Meteor.users.findOne({"username": challengeUsername})
    check(user, Object);

    var challengeId = Challenges.insert({
      gameAttributes: gameAttributes,
      senderId: Meteor.userId(),
      recipientId: user._id,
      sentAt: new Date(),
    });
    if (!challengeId) return console.log("Challenge couldn't be created.");

    return {
      _id: challengeId,
      recipient: user.username
    }
  }
});
