Template.pmMenu.helpers({
  showChallenges: function() {
    return false;
    var sentChallenges = Challenges.find({ senderId: Meteor.userId() });
    var receivedChallenges = Challenges.find({ $and: [ { recipientId: Meteor.userId() }, { acceptedAt: { $exists: false } }, ] });

    if (sentChallenges.count() > 0 || receivedChallenges.count() > 0) return true;
    else return false;
  },
  sentChallenges: function() {
    return false;
    return Challenges.find({
      senderId: Meteor.userId()
    });
  },
  receivedMessages: function() {
    // find the room where the current user is inside the users array
    // AND where the room type is private
    var usersPrivateChats = Rooms.find({
      $and: [
        { users : {$in : [Meteor.userId()]} },
        { type : 'pm' }
      ]
    })

    return usersPrivateChats;
  }
});

Template.pmMenu.events({
  'click #new-challenge': function(e) {
    Session.set("challengeEnabled", true);
    $('#create-game-menu').dropdown("toggle");
    $("#challenge-username").focus();
    e.stopPropagation();
  }
});
