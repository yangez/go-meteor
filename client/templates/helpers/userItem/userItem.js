Template.userItem.helpers({
  isWinner: function() {
    var game = this.game;
    if (this.color === "black") return game.winnerId === game.blackPlayerId;
    if (this.color === "white") return game.winnerId === game.whitePlayerId;
  },
  score: function() {
    return this.game.score;
  },
  joinable: function() {
    var game = this.game;
    return (game.blackPlayerId != Meteor.userId() && game.whitePlayerId != Meteor.userId());
  },
  currentUser: function() {
    var game = this.game;
    if (game.getColorOfPlayerId(Meteor.userId()) === this.color)
      return "current-user"
  },
  currentMove: function() {
    var game = this.game;
    moveColor = game.getColorOfCurrentMove();
    return moveColor === this.color;
  },

  // user context
  user: function() {
    var game = this.game;
    return game.getPlayerAtColor(this.color);
  },
  userIsOnline: function() {
    var object = Presences.findOne({userId: this._id});
    return (object && object.state);
  },

});
