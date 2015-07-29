Template.challengeMenu.helpers({
  showChallenges: function() {
    return Challenges.find().count() > 0;
  },
  sentChallenges: function() {
    return Challenges.find({
      senderId: Meteor.userId()
    });
  },
  receivedChallenges: function() {
    return Challenges.find({
      recipientId: Meteor.userId()
    });
  }
});

Template.challengeMenu.events({
});
