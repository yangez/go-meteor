Meteor.methods({

  "game/insert" : function(gameAttributes, userId) {
    check(gameAttributes, Object);
    var user = Meteor.users.findOne(userId);
    if (!user) throw new Meteor.Error("User not logged in.")

    var gameId = Games.create(gameAttributes, userId);
    return { _id: gameId }
  },

  "game/endOnTime" : function(gameId, color) {
    var game = Games.findOne(gameId);
    game.endGameOnTime(color);
  },

  "game/join" : function(gameId, color) {
    var user = Meteor.user();
    if (!user) throw new Meteor.Error("User not logged in.")

    var game = Games.findOne(gameId);

    game.joinGame(user._id, color)

    return { _id: game._id };
  },

  'game/message' : function(gameId, message) {
    var user = Meteor.user();
    if (!user) throw new Meteor.Error("User not logged in.")

    check(message, String);

    var game = Games.findOne(gameId);

    game.pushMessage(message);

    return {_id: game._id };
  },

  'game/rematch' : function(gameId) {
    var user = Meteor.user();
    if (!user) throw new Meteor.Error("User not logged in.")

    var game = Games.findOne(gameId);
    if (!game) throw new Meteor.Error("Game does not exist.");

    var challengeId = game.rematch();

    return {_id: game._id, challengeId: challengeId};
  },

  /* In-game actions */
  'game/action' : function(gameId, action, data) {
    var user = Meteor.user();
    if (!user) throw new Meteor.Error("User not logged in.")

    var game = Games.findOne(gameId);

    if (!game.hasPlayerId(user._id)) throw new Meteor.Error("User isn't part of the game.");

    if (["pass", "resign", "requestUndo", "acceptUndo", "denyUndo", "cancel", "acceptMD", "declineMD"].indexOf(action) > -1) {
      // invoke appropriate action on game object
      game[action]();
    }

    else if (action === "togglePointAsDead") {
      game.togglePointAsDead(data.x, data.y);
    }
    else if (action === "playMove") {
      game.playMove(data.x, data.y);
    }

  },

});
