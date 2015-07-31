Template.challengeMenu.helpers({
  showChallenges: function() {
    var sentChallenges = Challenges.find({ senderId: Meteor.userId() });
    var receivedChallenges = Challenges.find({ $and: [ { recipientId: Meteor.userId() }, { acceptedAt: { $exists: false } }, ] });

    if (sentChallenges.count() > 0 || receivedChallenges.count() > 0) return true;
    else return false;
  },
  sentChallenges: function() {
    return Challenges.find({
      senderId: Meteor.userId()
    });
  },
  receivedChallenges: function() {
    return Challenges.find({ $and: [
      { recipientId: Meteor.userId() },
      { acceptedAt: { $exists: false } },
    ] });
  }
});

Template.challengeMenu.events({
  'click #new-challenge': function(e) {
    Session.set("challengeEnabled", true);
    $('#create-game-menu').dropdown("toggle");
    $("#challenge-username").focus();
    e.stopPropagation();
  }
});
