Template.playerBox.helpers({
  userIsOnline: function() {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    var object = Presences.findOne({userId: user._id});
    return (object && object.state);
  },
  userPresent: function() {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    return this.game.userIdPresent(user._id) ? "in-game" : "";
  },
  captureCount: function() {
    if (!this.game.wgoGame) return false;
    var color = this.game.getColorOfPosition(this.position);
    if (color === "white") var wgoColor = WGo.W;
    else if (color === "black") var wgoColor = WGo.B;
    if (wgoColor) var theCount = this.game.wgoGame.getCaptureCount(wgoColor);
    if (theCount > 0) return theCount;
  },
  score: function() {
    var game = this.game;
    if (game.archived && game.winnerId && game.score) {
      var color = game.getColorOfPlayerId(game.winnerId);
      var positionColor = game.getColorOfPosition(this.position);
      if (color === positionColor) return game.score;
    }
  },
  undoRequested: function() {
    var game = this.game;
    if (this.position !== "top" || !game.undoRequested) return false;
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    return (user._id === game.undoRequested) ? "undo-requested" : false;
  }

});
