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

  },

  // decline a challenge this user was sent
  'user/declineChallenge': function(notificationId) {
    var notification = Herald.collection.findOne(notificationId)
    if (notification.courier !== "challengeNew")
      throw new Meteor.Error("Notification is not a challenge.");

    // notify the sender that their challenge was declined (later)

    // var sender = Meteor.users.findOne(notification.data.challengerId);
    // sender.sendNotification("challengeDeclined", { _id: notification._id });

    // remove the notification
    var user = Meteor.user();
    user.readNotification(notification._id);

  },

  // accept a challenge that this user was sent
  'user/acceptChallenge': function(notificationId) {

    // remove the notification
    var user = Meteor.user();
    user.readNotification(notificationId);

    // create new game with gameData

    // notify the sender that their challenge was accepted

  },

  // 'user/readNotification': function(notificationId) {
    // var user = Meteor.user();
  // },

});
