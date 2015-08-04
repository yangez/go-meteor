Meteor.methods({
  // create a new challenge from current user to challengeUsername
  'challenge/create': function(gameAttributes, challengeUsername) {

    if (!Meteor.user()) throw new Meteor.Error("User not logged in.")

    check(gameAttributes, Object);

    var user = Meteor.users.findOne({username: challengeUsername});
    if (user) throw new Meteor.Error("User not found.")

    var challengeId = Challenge.create(gameAttributes, user._id);

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
