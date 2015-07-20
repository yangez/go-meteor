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
    return (_.without(fieldNames, 'blackPlayerId', 'whitePlayerId', 'wgoGame', 'messages', 'archived', 'turnMarker', 'markedDead', 'markedSchema', 'userAcceptedMD', 'lastActivityAt', 'endedAt').length > 0);
  }
})

Meteor.methods({

  gameInsert: function(gameAttributes) {
    check(Meteor.userId(), String);

    var user = Meteor.user();

    var game = _.extend(gameAttributes, {
      gameCreated: new Date()
    });

    if (gameAttributes.color === "white")
      game = _.extend( game, { whitePlayerId: user._id } );
    else if (gameAttributes.color === "black")
      game = _.extend( game, { blackPlayerId: user._id } );
    game = _.omit( game, "color" );

    var gameId = Games.insert(game);
    return {
      _id: gameId
    }
  },

  joinGame: function(game, color, userId) {
    if (game.blackPlayerId === userId || game.whitePlayerId == userId) {
      return; // if they're already in the game
    }

    if (color === "black") {
      Games.update({_id: game._id}, {$set: { blackPlayerId: userId} } )
    } else if (color === "white") {
      Games.update({_id: game._id}, {$set: { whitePlayerId: userId} })
    }

    var game = Games.findOne(game._id);
    // push game started message if it's not already there
    if (game.blackPlayerId && game.whitePlayerId) {
      game.pushMessage("Game has started, "+game.playerToMove().username+" begins. Enjoy!", GAME_MESSAGE);
    }

    return { _id: game._id }
  },

  findPlayer: function(gameId, color) {
    var game = Games.findOne({_id: gameId});

    if (color == "black") {
      return Meteor.users.findOne({ _id: game.blackPlayerId })
    } else {
      return Meteor.users.findOne({ _id: game.whitePlayerId })
    }
  }


});
