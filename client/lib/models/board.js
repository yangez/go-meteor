Board = function(game, width){
  var board = Object.create(Board.prototype);

  board = _.extend(board, {
    gameId: game._id,
    board: new WGo.Board(document.getElementById("board"), {
      width: width,
      size: game.size,
      background: ""
    })
  });

  return board;
};

// destroy all other boards
Board.clearBoards = function() {
  $("#board").html("");
  return true;
};


var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

_.extend(Board.prototype, {

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
      var board = this.board;
      // add hover piece event listener
      board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
        // refresh game data
        game = Games.findOne(game._id);

        // only if it's your turn
        if (game.isCurrentPlayerMove()) {
          // remove old hoverstone
          var oldObj = Session.get("hoverStone"+game._id);
          Session.set("hoverStone"+game._id, undefined);
          if (oldObj) board.removeObject(oldObj);

          // if it's on the board and it's a valid move (no existing piece)
          if (game.wgoGame.isOnBoard(x, y) && game.wgoGame.isValid(x,y)) {
            // add new object
            if (game.wgoGame.turn === WGo.B) {
              var newObj = { x: x, y: y, type: "BLACK_HOVER" };
            } else {
              var newObj = { x: x, y: y, type: "WHITE_HOVER" };
            }
            board.addObject(newObj);
            Session.set("hoverStone"+game._id, newObj);
          }
        }
      });

      board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
        game = Games.findOne(game._id);

        if (game.isCurrentPlayerMove()) {
          var oldObj = Session.get("hoverStone"+game._id);
          Session.set("hoverStone"+game._id, undefined);
          if (oldObj) board.removeObject(oldObj);
        }
      });

      board.addEventListener("click", boardClickHandler = function(x, y) {
        game = Games.findOne(game._id);

        // invalidate hover piece
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);

        // play move
        Meteor.call('game/action', game._id, "playMove", {x: x, y: y}, function(error, result) {
          if (error) console.log(error.message);
        });
      });

    }
  },


});
