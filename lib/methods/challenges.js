Meteor.methods({
  // create a new challenge from current user to challengeUsername
  'challenge/create': function(gameAttributes, challengeUsername) {

    check(Meteor.user(), Object);
    check(gameAttributes, Object);
    var user = Meteor.users.findOne({"username": challengeUsername})
    check(user, Object);

    if (user._id === Meteor.userId()) throw new Meteor.Error("You can't challenge yourself.");

    var challengeId = Challenges.insert({
      gameAttributes: gameAttributes,
      senderId: Meteor.userId(),
      recipientId: user._id,
      sentAt: new Date(),
    });
    if (!challengeId) throw new Meteor.Error("Challenge couldn't be created.");

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

  'challenge/acknowledge': function(challengeId) {
    var result, challenge = Challenges.findOne(challengeId)
    if (challenge) results = challenge.acknowledge();
    return { _id: challengeId, acknowledged: results.result, gameId: results.gameId }
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
