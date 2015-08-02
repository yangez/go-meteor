Meteor.methods({

  "game/insert" : function(gameAttributes, userId) {
    check(gameAttributes, Object);
    var user = Meteor.users.findOne(userId);
    check(user, Object);

    var gameId = Game.create(gameAttributes, userId);
    return { _id: gameId }
  },

  "game/endOnTime" : function(gameId, color) {
    var game = Games.findOne(gameId);
    game.endGameOnTime(color);
  },

  "game/join" : function(gameId, color) {
    var user = Meteor.user();
    check(user, Object);

    var game = Games.findOne(gameId);

    game.joinGame(user._id, color)

    return { _id: game._id };
  },

  'game/message' : function(gameId, message) {
    var user = Meteor.user();

    check(user, Object);
    check(message, String);

    var game = Games.findOne(gameId);

    game.pushMessage(message);

    return {_id: game._id };
  },

  /* In-game actions */
  'game/action' : function(gameId, action, data) {
    var user = Meteor.user();
    check(user, Object);

    var game = Games.findOne(gameId);

    if (!game.hasPlayer(user)) return false;

    if (action === "pass")
      game.playPass();
    else if (action === "resign")
      game.resign();
    else if (action === "acceptMD")
      game.acceptMD();
    else if (action === "declineMD")
      game.declineMD();
    else if (action === "togglePointAsDead") {
      check(data, {x: Match.Integer, y: Match.Integer});
      game.togglePointAsDead(data.x, data.y);
    }
    else if (action === "playMove") {
      check(data, {x: Match.Integer, y: Match.Integer});
      game.playMove(data.x, data.y);
    }

  },

});
