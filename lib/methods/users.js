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

  'user/msg': function(message, roomId){
    var currentUser = Meteor.user();
    if(message.slice(0,2).toLowerCase() === '/w') {
      var splitted = message.split(' ');
      var sendeeName = splitted[1];
      var message = splitted.slice(2).join(' ');
      var sendee = Meteor.users.findOne({username : sendeeName});

      currentUser.sendPm(sendee, message);
    }else{
      var room = roomId ? Rooms.findOne(roomId) : Rooms.findOne({name: 'Global'});
      room.addMessage(message);
    }
  }
});
