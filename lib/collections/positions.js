// wgoGame position converted into a collection instead of an array

Positions = new Mongo.Collection('positions');

Positions.create = function(size) {
	var schema = [];

	for(var i = 0; i < size*size; i++) schema[i] = 0;

  var insert = {
    schema: schema,
    size: size
  }

  Positions.insert(insert);
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
  /* Currently doesn't work
	clone: function() {
		var clone = new Position(this.size);
		clone.schema = this.schema.slice(0);
		return clone;
	},
  */

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
	 * Determines score of single point based on Tromp-Taylor
	 *
	 * @return 1 (black), 0, -1 (white)
	 */
	 determineColor: function(index) {
		 // find values of all directions by traversing
		 var pointData = [];
		 pointData.push(this.traverse(index, "up"));
		 pointData.push(this.traverse(index, "down"));
		 pointData.push(this.traverse(index, "right"));
		 pointData.push(this.traverse(index, "left"));

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
		 else return console.log("Something went wrong in scorePosition()");

	 },

	 /**
	 * Traverses one direction until we hit a stone or the edge
	 *
	 * @return 1 (black encountered), 0 (edge encountered), -1 (white encountered)
	 */
	 traverse: function(pointIndex, direction) {
		 if (["up", "down", "left", "right"].indexOf(direction) === -1)
			 var direction = "up";

		 var sideLength = Math.sqrt(this.schema.length);

		 var increment;
		 if (direction === "up") increment = -1;
		 else if (direction === "down") increment = 1;
		 else if (direction === "right") increment = sideLength;
		 else if (direction === "left") increment = -sideLength;

		 pointIndex += increment;

		 // return 0 if this pointIndex is now off the board
		 if (
			 (direction === "up"
				 && pointIndex != 0 && (pointIndex % sideLength === (sideLength-1)) )
			 || (direction === "down"
			   && pointIndex != 0 && pointIndex % sideLength === 0 )
			 || (direction === "right"
				 && pointIndex > this.schema.length-1)
			 || (direction === "left"
				 && pointIndex < 0)
		 ) return 0;

		 // for base case when pointIndex = -1
		 else if (this.schema[pointIndex] === undefined) return 0;

		 // if it's colored stone, return black count
		 else if (this.schema[pointIndex] === WGo.B) return 1;
		 else if (this.schema[pointIndex] === WGo.W) return -1;

		 // if it's neither (another empty space) traverse again in the same direction
		 else return this.traverse(pointIndex, direction);

	 },
});
