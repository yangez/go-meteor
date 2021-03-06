_ = lodash;

// show message on top right corner
showMessage = function(message, type) {
  Errors.insert({message: message});
};

// helper function to convert coordinates to a schema index, given a schema
convertCoordinatesToSchemaIndex = function(schema, x, y) {
  var size = Math.sqrt(schema.length);
  if (x >= 0 && y >= 0 && x < size && y < size) // if it's on board
    return size * x + y;
}

// helper function to convert schema indices to coordinates, given a schema
convertSchemaIndexToCoordinates = function(schema, index) {
  var size = Math.sqrt(schema.length);
  return {
    x: Math.floor(index/size),
    y: index % size
  }
}


// get kyu or dan rank from elo rating
getRankFromRating = function(rating)  {
  var result;
  if (!rating) throw new Meteor.Error("No rating input.");

  if (rating <= -400) result = "25k";
  else if (rating < 2100) { // kyu
    var kyuRating = 2100 - rating
    var kyuRank = Math.ceil(kyuRating/100);
    result = kyuRank+"k";
  }
  else if (rating < 2900){ // dan
    var danRating = rating-2100;
    var danRank = Math.floor(danRating/100)+1;
    result = danRank+"d";
  } else result = "9d";

  return result;
},

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

timeDisplay = function(ms, format) {
  var string;
  if (!format) format = "numbers";
  if (ms < 0) ms = 0;
  var duration = moment.duration(ms);

  var seconds = duration.seconds();
  var minutes = duration.minutes();
  var hours = duration.hours();

  if (format === "numbers") {
    if (hours) string = hours + ":" + padToTwo(minutes) + ":" + padToTwo(seconds);
    else string = minutes + ":" + padToTwo(seconds);
  } else if (format === "letters") {
    string = "";
    if (hours) string += hours + "h"
    if (minutes) string += minutes + "m"
    if (seconds) string += seconds + "s"
  }

  return string;
}

byoToString = function(periods, time, format) {
  var string = "";
  string += periods + "x" + timeDisplay(time, format);
  return string;
}

padToTwo = function(number) {
  if (number<=99) { number = ("0"+number).slice(-2); }
  return number;
}
