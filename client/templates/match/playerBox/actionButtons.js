Template.actionButtons.helpers({
  gameEnded: function() {
    return this.game.archived;
  },
  isBottom: function() {
    return this.position == "bottom";
  },
  markingDead: function() {
    if (!this.game) return false;
    return this.game.markingDead();
  },
  mdDisabled: function() {
    if (!this.game) return false;
    var game = Games.findOne(this.game._id); // refresh
    return (game.userAcceptedMD === Meteor.userId()) ? "disabled" : "";
  },
  isCurrentPlayer: function() {
    
  }
});
