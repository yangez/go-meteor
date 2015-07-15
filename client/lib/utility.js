Meteor.subscribe('allUsers');

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
