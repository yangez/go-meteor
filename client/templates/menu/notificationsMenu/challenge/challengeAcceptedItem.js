Template.challengeAcceptedItem.onRendered(function() {

  var notification = this.data;

  this.autorun(function() {

    // mark game notifications as read if we're looking at the game
    var routeName = Router.current().route.getName();
    if (routeName === "match") {

      var currentGameId = Router.current().params._id;
      if (currentGameId === notification.data.gameId) {
        var user = Meteor.user();
        user.readNotification(notification._id);
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
