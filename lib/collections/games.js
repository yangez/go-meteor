// we're leaving Games like this for the moment, until we do the Position refactoring. Then we'll change it to the new collection-helpers method.
Games = new Mongo.Collection('games', {
  transform: function(doc) {
    // add Game functions
    var game = new Game(doc);

    if ( typeof WGo !== 'undefined' ) {
      // reconstruct WGo.Game object
      var oGame = game.wgoGame;
      game.wgoGame = new WGo.Game(oGame.size, oGame.repeat);
      game.wgoGame.stack = oGame.stack;
      game.wgoGame.turn = oGame.turn;
      game.wgoGame = game.wgoGame.importPositions();

      // reconstruct lastPosition object
      if (game.previousPosition) var oPosition = _.clone(game.previousPosition);
      else var oPosition = game.wgoGame.getPosition();
      game.previousPosition = new WGo.Position(oPosition.size)
      game.previousPosition = _.extend(game.previousPosition, oPosition);

    }
    return game;
  }
});
