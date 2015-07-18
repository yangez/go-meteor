Games = new Mongo.Collection('games', {
  // reconstruct WGo.Game object whenever we retrieve game objects
  transform: function(doc) {
    if ( typeof WGo !== 'undefined' && doc.wgoGame ) {
      var oGame = doc.wgoGame;
      doc.wgoGame = new WGo.Game(oGame.size, oGame.repeat);
      doc.wgoGame.stack = oGame.stack;
      doc.wgoGame.turn = oGame.turn;

      doc.wgoGame = doc.wgoGame.importPositions();
    }
    return doc;
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
    return (_.without(fieldNames, 'blackPlayerId', 'whitePlayerId', 'wgoGame', 'boardState', 'messages', 'archived', 'previousMarker', 'markedDead', 'markedSchema').length > 0);
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
      pushMessage(game, "Game has started, "+playerToMove(game).username+" begins. Enjoy!", GAME_MESSAGE);
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
