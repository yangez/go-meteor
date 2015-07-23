Meteor.methods({

  "game/insert" : function(gameAttributes) {
    var user = Meteor.user();

    check(user, Object);

    if (["9", "13", "19"].indexOf(gameAttributes.size) === -1) size = 9;

    var wgoGame = new WGo.Game(gameAttributes.size);

    var game = _.extend(gameAttributes, {
      gameCreated: new Date(),
      lastActivityAt: new Date(),
      wgoGame: wgoGame.exportPositions(),
    });

    if (gameAttributes.color === "white")
      game = _.extend( game, { whitePlayerId: user._id } );
    else if (gameAttributes.color === "black")
      game = _.extend( game, { blackPlayerId: user._id } );
    game = _.omit( game, "color" );

    var gameId = Games.insert(game);
    return { _id: gameId }
  },

  "game/join" : function(game, color) {
    var user = Meteor.user();
    check(user, Object);

    if (!game && game.hasPlayer(user)) return;

    if (color === "black") {
      Games.update({_id: game._id}, {$set: { blackPlayerId: user._id} } )
    } else if (color === "white") {
      Games.update({_id: game._id}, {$set: { whitePlayerId: user._id} })
    }

    var game = Games.findOne(game._id);
    // push game started message if it's not already there
    if (game.blackPlayerId && game.whitePlayerId) {
      game.pushMessage("Game has started, "+game.playerToMove().username+" begins. Enjoy!", GAME_MESSAGE);
    }

    return { _id: game._id }
  }

});
