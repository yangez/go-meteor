Board = function(game, width){
  var board = Object.create(Board.prototype);

  board = _.extend(board, {
    gameId: game._id,
    board: new WGo.Board(document.getElementById("board"), {
      width: width,
      size: game.size,
      // background: "/wood1.jpg",
      // background: "#e5c07e",
      background: "#dbae69",
    	stoneHandler: WGo.Board.drawHandlers.NORMAL,
      section: {
        top: -0.75,
        left: -0.75,
        right: -0.75,
        bottom: -0.75
      }
    }),
    // create new blank position on the board
    position: Positions.new(game._id, {
      capCount: { black: 0, white: 0 },
      turn: WGo.B
    })
  });

  board.addCoordinates();

  return board;
};

// destroy all other boards
Board.clearBoards = function() {
  $("#board").html("");
  return true;
};

var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

_.extend(Board.prototype, {

  // set a new position for the board. Updates appropriately
  setPosition: function(position) {
    // 1. update the board from old position to new position
    this.update(this.position, position);

    // set current board position as the new position
    this.position = position;
  },

  // Remove all md markers, then add md markers to board
  updateMDMarkers: function() {
    var game = Games.findOne(this.gameId);
    var board = this.board;
    board.removeObjectsOfType("DEAD");
    if (game.deadMarkers && game.deadMarkers.length > 0) {
      board.addObject(game.deadMarkers);
    }
  },

  // Update the 'last turn' marker on the board
  updateTurnMarker: function() {
    var game = Games.findOne(this.gameId);
    var board = this.board;
    board.removeObjectsOfType("CR");
    if (game.turnMarker && game.turnMarker.type && game.turnMarker.x != "pass") {
      board.addObject(game.turnMarker) ;
    }
  },

  // add a hovering stone over x, y
  addHover: function(x, y) {
    var game = Games.findOne(this.gameId)
    if (game.isOnBoard(x, y) && game.isValid(x,y)) {
      var type = game.turn === WGo.B ? "BLACK_HOVER" : "WHITE_HOVER";
      this.board.addObject({ x: x, y: y, type: type });
    }
  },

  // clear all hovering stones
  clearHover: function() {
    var board = this.board;
    board.removeObjectsOfType("BLACK_HOVER");
    board.removeObjectsOfType("WHITE_HOVER");
  },

  // update board from oldPosition to newPosition
  update: function(oldPosition, newPosition) {
    var board = this.board;
    var boardDifference = getPositionDifference( oldPosition, newPosition );
    board.update(boardDifference);
    return true;
  },


  /* Event Handlers */

  // remove markdead event handlers
  removeMDEventHandlers: function() {
    var board = this.board;
    if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  },

  // add markdead event handlers
  addMDEventHandlers: function() {
    var game = Games.findOne(this.gameId)
    if ( // if we're currently marking dead in this game, and this is a player
      game &&
      game.hasPlayerId(Meteor.userId()) &&
      game.markingDead()
    ) {
      var board = this.board;
      board.addEventListener("click", MDClickHandler = function(x, y) {

        Meteor.call('game/action', game._id, "togglePointAsDead", {x: x, y: y}, function(error, result) {
          if (error) console.log(error.message);
        });

      });
    }
  },

  // remove regular event handlers
  removeEventHandlers: function() {
    var board = this.board;
    if (boardMouseMoveHandler) board.removeEventListener("mousemove", boardMouseMoveHandler);
    if (boardMouseOutHandler) board.removeEventListener("mouseout", boardMouseOutHandler);
    if (boardClickHandler) board.removeEventListener("click", boardClickHandler);
  },

  // add regular event handlers
  addEventHandlers: function() {
    var game = Games.findOne(this.gameId);
    if (
      game &&
      game.hasPlayerId(Meteor.userId()) &&
      game.isReady()
    ) {
      var _this = this;

      // add hover piece event listener
      this.board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
        if (game.isCurrentPlayerMove()) {
          _this.clearHover();
          _this.addHover(x, y);
        }
      });

      // remove hover piece
      this.board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
        game = Games.findOne(game._id);

        if (game.isCurrentPlayerMove()) _this.clearHover();
      });

      // "play" logic
      this.board.addEventListener("click", boardClickHandler = function(x, y) {
        game = Games.findOne(game._id);


        // play move
        Meteor.call('game/action', game._id, "playMove", {x: x, y: y}, function(error, result) {
          if (error) return console.log(error.message);

          _this.clearHover();
        });
      });

    }
  },


  addCoordinates: function() {
    var coordinates = {
      // draw on grid layer
      grid: {
        draw: function(args, board) {
          var ch, t, xright, xleft, ytop, ybottom;

          this.fillStyle = "rgba(0,0,0,0.7)";
          this.textBaseline="middle";
          this.textAlign="center";
          this.font = board.stoneRadius+"px "+(board.font || "");

          xright = board.getX(-0.75);
          xleft = board.getX(board.size-0.25);
          ytop = board.getY(-0.75);
          ybottom = board.getY(board.size-0.25);

          for(var i = 0; i < board.size; i++) {
            ch = i+"A".charCodeAt(0);
            if(ch >= "I".charCodeAt(0)) ch++;

            t = board.getY(i);
            this.fillText(board.size-i, xright, t);
            this.fillText(board.size-i, xleft, t);

            t = board.getX(i);
            this.fillText(String.fromCharCode(ch), t, ytop);
            this.fillText(String.fromCharCode(ch), t, ybottom);
          }

          this.fillStyle = "black";
        }
      }
    }
    this.board.addCustomObject(coordinates);
  }

});
