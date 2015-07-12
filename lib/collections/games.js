Games = new Mongo.Collection('games');

// attributes

//   title
//   size:
//   black player id
//   white player id
//

Meteor.methods({
  gameInsert: function(gameAttributes) {
    // check(Meteor.userId(), String);

    /*
    check(postAttributes, {
      title: String,
      url: String
    });
    */

    var user = Meteor.user();
    var game = _.extend(gameAttributes, {
      blackPlayerId: user._id,
      gameCreated: new Date()
    });
    var gameId = Games.insert(game);
    return {
      _id: gameId
    }
  }
});
