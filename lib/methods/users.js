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

    var challenger = Meteor.user();
    if (!challenger) throw new Meteor.Error("User isn't logged in.");

    var challenged = Meteor.users.findOne(userId);
    if (!challenged) throw new Meteor.Error("This user doesn't exist.");

    challenged.sendNotification("challengeNew", {
      challengerId: challenger._id,
      gameData: gameData
    });

    return {
      recipient: challenged.username
    }

  }

  // 'user/readNotification': function(notificationId) {
    // var user = Meteor.user();
  // },

});
