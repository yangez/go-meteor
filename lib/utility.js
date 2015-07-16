
isReady = function(game) {
  if (!game.wgoGame) return false;
  if (game.archived) return false;
  if (game.blackPlayerId && game.whitePlayerId) return true;
  return false;
}

gameHasPlayer = function(game, user) {
  if (!user) return false;
  if (user._id === game.blackPlayerId || user._id === game.whitePlayerId)
    return true;
  else return false;
}

getColorOfPosition = function(game, position) {
    var currentUserColor = getColorOfPlayerId(game, Meteor.userId());
    // if current user is part of this game
    if (currentUserColor) {
      if (position === "bottom") { // bottom: show current user
        return currentUserColor;
      } else if (position === "top") { // top: show opponent
        return getOppositeColor(currentUserColor);
      }
    }
    // if current user not part of this game (or no current user)
    else {
      if (position === "bottom")
        return "black";
      else if (position === "top")
        return "white";
    }
    return false; // default return empty object
}

getColorOfPlayerId = function(game, playerId) {
  if (!game || !playerId) return false;
  if (game.blackPlayerId === playerId)
    return "black"
  else if (game.whitePlayerId === playerId)
    return "white"
  return false;
}

getPlayerAtColor = function(game, color) {
  if (color === "white") {
    if (game.whitePlayerId) return Meteor.users.findOne( game.whitePlayerId );
  } else if (color === "black") {
    if (game.blackPlayerId) return Meteor.users.findOne( game.blackPlayerId );
  }
  return false;
}

getOppositeColor = function(color) {
  if (color === "white")
    return "black";
  else if (color === "black")
    return "white";
  return false;
}

getCurrentMove = function(game) {
  if (!game || !game.wgoGame) return false;
  if (game.archived || !isReady(game)) return false;
  if (game.wgoGame.turn === 1) return "black";
  else if (game.wgoGame.turn === -1) return "white";
}

isCurrentPlayerMove = function(game) {
  var player = playerToMove(game);
  if (player && Meteor.userId()) return player._id === Meteor.userId();
}

playerToMove = function(game) {
  var color = getCurrentMove(game);
  if (color) {
    var player = getPlayerAtColor(game, color);
    if (player) return player;
  }
}

GAME_MESSAGE = {gameMessage: true};
pushMessage = function(game, message, user) {
  if (!game) return false;
  if (!game.messages) game.messages = [];

  var username, styleClass;

  if (user) {
    if (user.gameMessage) {
      username = false;
      styleClass = "game-message";
    }
    else if (user.username) username = user.username;
    else username = false;
  }

  var messageObj = {
    author: username,
    content: message,
    class: styleClass
  }

  if (user) // push to collection
    return Games.update({_id: game._id}, {$push: {messages: messageObj}});
  else // push to local collection (goes away when messages updates)
    return Games._collection.update({_id: game._id}, {$push: {messages: messageObj}})
}
