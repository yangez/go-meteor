Template.yourGameRow.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
});
Template.yourGameRow.helpers({
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
    return this.isCurrentPlayerMove() ? "your-turn" : ""
  },
});
