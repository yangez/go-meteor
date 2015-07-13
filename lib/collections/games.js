Games = new Mongo.Collection('games');

Meteor.methods({
  gameInsert: function(gameAttributes) {
    check(Meteor.userId(), String);

    /*
    check(gameAttributes, {
      title: String,
      size: String,
      // color: String
    });
    */

    var user = Meteor.user();

    console.log(gameAttributes);

    var game = _.extend(gameAttributes, {
      gameCreated: new Date()
    });

    if (gameAttributes.color === "white")
      game = _.extend( game, { whitePlayerId: user._id } );
    else if (gameAttributes.color === "black")
      game = _.extend( game, { blackPlayerId: user._id } );
    game = _.omit( game, "color" );

    console.log(game);

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
