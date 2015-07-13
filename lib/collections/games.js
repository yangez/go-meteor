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

  joinGame: function(gameId, color, userId) {
    if (color === "black") {
      return Games.update({_id: gameId}, {$set: { blackPlayerId: userId} } )
    } else {
      return Games.update({_id: gameId}, {$set: { whitePlayerId: userId} })
    }
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
