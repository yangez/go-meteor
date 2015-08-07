Template.challengeAcceptedItem.onRendered(function() {
  var challenge = this.data;

  this.autorun(function() {

    // mark game notifications as read if we're looking at the game
    var routeName = Router.current().route.getName();
    if (routeName === "match") {

      var currentGameId = Router.current().params._id;
      if (currentGameId === challenge.data.gameId) {
        var user = Meteor.user();
        user.readNotification(challenge._id);
      }
    }

  });

});

Template.challengeAcceptedItem.helpers({
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
  type: function() {
    return this.data.gameData.rematchOf ? "Rematch" : "Challenge"
  },
});

Template.challengeAcceptedItem.events({
  'click .mark-read': function(e) {
    e.stopPropagation();
    var user = Meteor.user();
    user.readNotification(this._id);
  },
  'click tr': function(e) {
    Router.go("match", {_id: this.data.gameId});
  },

})
