Meteor.methods({
  // create a new challenge from current user to challengeUsername
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
  },

  'challenge/cancel': function(challengeId) {
    var result, challenge = Challenges.findOne(challengeId)
    if (challenge) result = challenge.cancel();
    return { _id: challengeId, canceled: result }
  },

  'challenge/accept': function(challengeId) {
    var result, challenge = Challenges.findOne(challengeId)
    if (challenge) results = challenge.accept();
    return { _id: challengeId, accepted: results.result, gameId: results._id }
  },

  'challenge/decline': function(challengeId) {
    var result, challenge = Challenges.findOne(challengeId)
    if (challenge) result = challenge.decline();
    return { _id: challengeId, declined: result }
  },


});
