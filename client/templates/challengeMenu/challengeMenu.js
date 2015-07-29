Template.challengeMenu.helpers({
  sentChallenges: function() {
    Challenges.find({
      senderId: Meteor.userId()
    });
  },
  receivedChallenges: function() {
    Challenges.find({
      recipientId: Meteor.userId()
    });
  }
});
