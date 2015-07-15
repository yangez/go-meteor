Meteor.subscribe('allUsers');

gameHasPlayer = function(game, user) {
  if (!user) return false;
  if (user._id === game.blackPlayerId || user._id === game.whitePlayerId)
    return true;
  else return false
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
