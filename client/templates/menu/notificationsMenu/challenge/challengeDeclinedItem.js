Template.challengeDeclinedItem.helpers({
  opponent: function() {
    var opponentId = this.data.recipientId;
    var opponent = Meteor.users.findOne(opponentId);
    return opponent.username;
  },
  color: function() {
    return this.data.gameData.color;
  },
  size: function() {
    return this.data.gameData.size;
  },
});

Template.challengeDeclinedItem.events({
  'click .mark-read': function(e) {
    e.stopPropagation();
    var user = Meteor.user();
    user.readNotification(this._id);
  },
  'click tr': function(e) {
    e.stopPropagation();
  },

})
