Template.yourGameRow.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('match', { _id: this._id });
  },
});
Template.yourGameRow.helpers({
  isCurrentGame: function() {
    var currentRouteName = Router.current().route.getName();
    if (currentRouteName === "match") {
      return Router.current().params._id === this._id ? "success" : "";
    }
  },
  opponentColor: function() {
    var thisColor = this.getColorOfPlayerId(Meteor.userId());
    return getOppositeColor(thisColor);
  },
  color: function() {
    return this.getColorOfPlayerId(Meteor.userId());
  },
  moveNumber: function() {
    return this.wgoGame.stack.length
  },
  yourTurn: function() {
    return (
      // either it's the current player move
      this.isCurrentPlayerMove() ||

      // OR we're in markDead and the userAcceptedMD is not us
      ( this.markingDead() && this.userAcceptedMD != Meteor.userId() )

    ) ? "your-turn" : "";
  },
  timeLeft: function() {
    var game = Games.findOne(this._id);
    if (!game.isTimed()) return false;

    var color = game.getColorOfPlayerId(Meteor.userId());

    var totalTimeLeft = game.totalTimeLeft(color);

    if (totalTimeLeft >= 0) {
      game.checkTimerFlag();

      var absTimeLeft = game.absTimeLeft(color);

      if (absTimeLeft > 0) return timeDisplay(absTimeLeft);
      else {
        var byoFormatted = game.byoFormatTimeLeft(color);
        var byoString = byoFormatted.periods + " x " + byoFormatted.time;
        return byoString;
      }

    } else return false;

  }
});
