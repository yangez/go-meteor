Meteor.methods({
  // autocomplete function for challenge username
  'user/autocomplete': function(query, options) {
    options = options || {};
    // guard against client-side DOS: hard limit to 50
    if (options.limit) {
      options.limit = Math.min(50, Math.abs(options.limit));
    } else {
      options.limit = 50;
    }
    var regex = new RegExp("^" + query);
    return Meteor.users.find({username: {$regex:  regex}}, options).fetch();
  },

  // challenge this user to a match
  'user/challenge': function(userId, gameData) {
    var user = Meteor.user();
    var recipient = Meteor.users.findOne(userId);
    if (user && recipient) return user.challenge(recipient._id, gameData)
  },

  // decline a challenge this user was sent
  'user/declineChallenge': function(notificationId) {
    var user = Meteor.user();
    return user.declineChallenge(notificationId);
  },

  // accept a challenge that this user was sent
  'user/acceptChallenge': function(notificationId) {
    var user = Meteor.user();
    return user.acceptChallenge(notificationId);
  },

  // 'user/readNotification': function(notificationId) {
    // var user = Meteor.user();
  // },

});
