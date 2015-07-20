// helper function to convert coordinates to a schema index, given a schema
convertCoordinatesToSchemaIndex = function(schema, x, y) {
  var size = Math.sqrt(schema.length);
  if (x >= 0 && y >= 0 && x < size && y < size) // if it's on board
    return size * x + y;
}

// get opposite color name
getOppositeColor = function(color) {
  if (color === "white")
    return "black";
  else if (color === "black")
    return "white";
  return false;
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
