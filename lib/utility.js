GAME_MESSAGE = {gameMessage: true};

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

// return change object between two positions that can be used by WGo.Board::update()
getPositionDifference = function(oldPosition, newPosition) {
  var size = oldPosition.size, add = [], remove = [];
  for(var i = 0; i < size*size; i++) {
    if ( oldPosition.schema[i] && !newPosition.schema[i]) {
      remove.push({
        x: Math.floor(i/size),
        y: i % size
      });
    }
    else if ( oldPosition.schema[i] != newPosition.schema[i]) {
      add.push({
        x: Math.floor(i/size),
        y: i % size,
        c: newPosition.schema[i]
      });
    }
  }
  return {
    add: add,
    remove: remove
  }
}
