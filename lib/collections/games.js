Games = new Mongo.Collection('games', {
  transform: function(doc) {
    // add Game functions
    var game = new Game(doc);

    // reconstruct WGo.Game object
    if ( typeof WGo !== 'undefined' && game.wgoGame ) {
      var oGame = game.wgoGame;
      game.wgoGame = new WGo.Game(oGame.size, oGame.repeat);
      game.wgoGame.stack = oGame.stack;
      game.wgoGame.turn = oGame.turn;

      game.wgoGame = game.wgoGame.importPositions();
    }
    return game;
  }
});

// only allow these field names... still pretty insecure
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
