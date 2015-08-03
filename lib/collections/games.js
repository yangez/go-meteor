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
      if (game.previousPosition) {
        var oPosition = _.clone(game.previousPosition);
        game.previousPosition = new WGo.Position(oPosition.size)
        game.previousPosition = _.extend(game.previousPosition, oPosition);
      }
    }

    return game;
  }
});

// we moved everything server-side so we don't need these anymore
/*
Games.allow({
  update: function(userId) {
    if (userId) return true;
  }
})
Games.deny({
  update: function(userId, game, fieldNames) {
    return (_.without(fieldNames, 'blackPlayerId', 'whitePlayerId', 'wgoGame', 'messages', 'archived', 'turnMarker', 'markedDead', 'markedSchema', 'deadMarkers', 'userAcceptedMD', 'lastActivityAt', 'endedAt', "score", 'winnerId', 'loserId' ).length > 0);
  }
})
*/
