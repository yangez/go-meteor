Template.yourTurnItem.helpers({
  game: function() {
    return Games.findOne(this.data.gameId);
  },

  // in game context
  opponentColor: function() {
    var thisColor = this.getColorOfPlayerId(Meteor.userId());
    return getOppositeColor(thisColor);
  },
  color: function() {
    return this.getColorOfPlayerId(Meteor.userId());
  },
});

Template.yourTurnItem.events({

  'click tr': function(e) {
    var user = Meteor.user();
    user.readNotification(this._id);
  }

})
