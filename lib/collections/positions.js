/*
gameId: ...
schema: []
size: 19
capCount: { black: 0, white: 0 },
turn: WGo.B
createdAt: new Date()
*/

Positions = new Mongo.Collection('positions');

// create new Position but don't save it
Positions.new = function(gameId, posAttributes) {
  var game = Games.findOne(gameId);
  if (!game) throw new Meteor.Error("Game not found!");

  var size = game.size;
  var schema = [];

  for(var i = 0; i < size*size; i++) schema[i] = 0;

  var position = {
    schema: schema,
    size: size,
    gameId: game._id,
    createdAt: new Date()
  };

  if (posAttributes) position = _.extend(position, posAttributes);

  // so we can use Position methods on this before we save it to Mongo
  position = Positions._transform(position);

  return position;
}

// create new Position and save it
Positions.create = function(gameId, posAttributes) {
  var insert = Positions.new(gameId, posAttributes);
  return Positions.insert(insert);
}

Positions.helpers({

  /**
  * Returns value of given coordinates.
  *
  * @param {number} x coordinate
  * @param {number} y coordinate
  * @return {(WGo.BLACK|WGo.WHITE|0)} color
  */
  get: function(x,y) {
    if(x < 0 || y < 0 || x >= this.size || y >= this.size) return undefined;
    return this.schema[x*this.size+y];
  },

  /**
  * Sets value of given coordinates.
  *
  * @param {number} x coordinate
  * @param {number} y coordinate
  * @param {(WGo.B|WGo.W|0)} c color
  */
  set: function(x,y,c) {
    this.schema[x*this.size+y] = c;
    return this;
  },

  /**
  * Clears the whole position (every value is set to 0).
  */
  clear: function() {
    for(var i = 0; i < this.size*this.size; i++) this.schema[i] = 0;
    return this;
  },

  /**
  * Clones the whole position.
  *
  * @return {WGo.Position} copy of position
  */
  clone: function() {
    var clone = Positions.new(this.gameId);
    clone.schema = _.clone(this.schema);
    return clone;
  },

  /**
  * Get score values of schema based on Tromp-Taylor
  *
  * @return "W+3", "B+2"
  */
  formattedScore: function() {
    var score = this.score();
    var modifier = (score < 0) ? "W+" : "B+";

    return modifier+Math.abs(score);
  },

  /**
  * Get score values of schema based on Tromp-Taylor
  *
  * @return integer score (positive value black, negative value white)
  */
  score: function() {
    var boardScore = this.getScoreSchema().reduce(function(a, b){ return a += b; }, 0);
    var komi = -6.5;
    return boardScore + komi;
  },

  /**
  * Get score values of schema based on Tromp-Taylor
  *
  * @return schema with all points correctly scored
  */
  getScoreSchema: function() {
    var position = this;
    var data = {
      whiteScore: 0,
      blackScore: 0,
      contestedCount: 0
    }
    var schema = this.schema;
    // copy array
    var scoreSchema = [];

    schema.forEach(function(point, index){
      if (point === WGo.B) scoreSchema.push(1);
      else if (point === WGo.W) scoreSchema.push(-1);
      else scoreSchema.push(position.determineColor(index));
    });

    return scoreSchema;
  },

  /**
  * Determines score of single unoccupied point based on Tromp-Taylor
  *
  * @return 1 (black), 0, -1 (white)
  */
  determineColor: function(index) {
    // find values of all directions by traversing
    var pointData = [];
    pointData.push(this.traverseBlank(index, "up"));
    pointData.push(this.traverseBlank(index, "down"));
    pointData.push(this.traverseBlank(index, "right"));
    pointData.push(this.traverseBlank(index, "left"));

    // if it connects with both white and black, or if it connects with neither
    // return neutral
    if (
      (pointData.indexOf(WGo.B) > -1 && pointData.indexOf(WGo.W) > -1) ||
      (pointData.indexOf(WGo.B) === -1 && pointData.indexOf(WGo.W) === -1)
    ) return 0;

    // if it connects with only black, this point is scored for black
    else if (pointData.indexOf(WGo.B) > -1 && pointData.indexOf(WGo.W) === -1)
    return WGo.B;

    // if it connects with only white, this point is scored for white
    else if (pointData.indexOf(WGo.B) === -1 && pointData.indexOf(WGo.W) > -1)
    return WGo.W;

    // shoiuld never happen
    else return console.log("Something went wrong in determineColor");

  },

  /**
  * Traverses one direction until we hit a stone or the edge (used in scoring)
  *
  * @return 1 (black encountered), 0 (edge encountered), -1 (white encountered)
  */
  traverseBlank: function(pointIndex, direction) {
    var result = this.travel(pointIndex, direction);
    if (result === 0) { // if blank, keep going
      pointIndex += this.getDirectionIncrement(direction);
      this.traverseBlank(pointIndex, direction);
    }

    // if edge, return 0
    else if (result === false) return 0;

    // if -1 or 1, return that value
    else return result;
  },


  /**
  * Traverses single stone to find all connected ones
  *
  * @return array [pointIndex] connected stones' indices
  */
  traverseStones: function(pointIndex, existing) {
    if (!existing) var existing = []; // base case
    var color = this.schema[pointIndex];

    // push this index to the results pile
    if (color) {
      existing.push(pointIndex);

      // 1. check up, down, left, right
      var directions = ["up", "down", "left", "right"];
      var _this = this;
      directions.forEach(function(direction) {
        if ( _this.travel(pointIndex, direction) === color ) {
          var newIndex = pointIndex + _this.getDirectionIncrement(direction);
          if (existing.indexOf(newIndex) === -1)
            _.extend(existing, _this.traverseStones(newIndex, existing));
        }
      });
    }

    return existing;
  },


  /**
  * Travel one space to a certain direction, returns what it finds
  *
  * @return 1 (black), 0 (blank), -1 (white), false (edge)
  */
  travel: function(pointIndex, direction) {
    if (["up", "down", "left", "right"].indexOf(direction) === -1)
    var direction = "up";

    pointIndex += this.getDirectionIncrement(direction);

    // return undefined if this pointIndex is now off the board
    var sideLength = Math.sqrt(this.schema.length);
    if (
      (direction === "up"
      && pointIndex != 0 && (pointIndex % sideLength === (sideLength-1)) )
      || (direction === "down"
      && pointIndex != 0 && pointIndex % sideLength === 0 )
      || (direction === "right"
      && pointIndex > this.schema.length-1)
      || (direction === "left"
      && pointIndex < 0)
    ) return false;

    // for base case when pointIndex = -1
    else if (this.schema[pointIndex] === undefined) return false;

    // if it's colored stone, return black count
    else if (this.schema[pointIndex] === WGo.B) return 1;
    else if (this.schema[pointIndex] === WGo.W) return -1;

    // if it's neither (another empty space) return 0.
    else return 0;
  },


  /**
  * Get increment of certain direction
  *
  * @return increment based on game's size
  */
  getDirectionIncrement: function(direction) {
    var sideLength = Math.sqrt(this.schema.length);

    var increment;
    if (direction === "up") increment = -1;
    else if (direction === "down") increment = 1;
    else if (direction === "right") increment = sideLength;
    else if (direction === "left") increment = -sideLength;
    else throw Meteor.Error("Direction is not valid.");

    return increment;
  }

});
