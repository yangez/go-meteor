Meteor.methods({

  "game/insert" : function(gameAttributes) {
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

  "game/join" : function(game, color, userId) {
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
  }

});
