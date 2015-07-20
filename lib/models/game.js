// method to combine functions with Games document retrieved from Mongo
Game = function(doc) {
  _.extend(this, doc);
};

// functions to combine
_.extend(Game.prototype, {
  createGame: function(size, repeat) {

    if (["9", "13", "19"].indexOf(size) === -1) {
      console.log("invalid size, using 9");
      size = 9;
    }

    if (!this.wgoGame) {
      var wgoGame = new WGo.Game(size, repeat);
      Games.update({_id: this._id }, { $set: { wgoGame: wgoGame.exportPositions(), messages:[] } });
    }

    return this;
  },

});
