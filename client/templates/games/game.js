// board display logic
var rBoard;

// on rendered
Template.board.onRendered(function(e){
  gameData = this.data;

  gameData.createGame(gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  // remove any event handlers, set correct session variables
  removeEventHandlers(board);
  removeMDEventHandlers(board);

  // restore previous game state
  updateBoard(game.wgoGame.stack[0], game.wgoGame.getPosition());

  // update MD markers
  game.updateMDMarkers(board);
  game.updateTurnMarker(board);

  // add appropriate event handlers to game
  if (game.markingDead()) addMDEventHandlers(board);
  else if (game.isReady()) addEventHandlers(board);

});

Template.board.helpers({
  'restoreState' : function(){
    // game stuff
    var oldGame = this;
    var newGame = Games.findOne(this._id);

    // update board to new position after move in Playing mode
    if (newGame.isReady()){
      updateBoard(oldGame.wgoGame.getPosition(), newGame.wgoGame.getPosition());
    }


    if (rBoard) {
      var board = rBoard.get();
      newGame.updateMDMarkers(board);

      newGame.updateTurnMarker(board);
    }

  },
  'eventRefresh': function() {
    var game = Games.findOne(this._id);
    if (Meteor.user()) {
      if (rBoard) { // if board exists

        var board = rBoard.get();

        // if game state is finished, remove all event handlers
        if (game.archived) {
          removeEventHandlers(board);
          removeMDEventHandlers(board);
        }

        // if game state is marking dead, add marking dead event handlers
        else if (game.markingDead()) {
          removeEventHandlers(board);
          addMDEventHandlers(board);
        }

        // if game state is playing and has current player, add game event handlers
        else {
          removeMDEventHandlers(board);
          addEventHandlers(board);
        }
      }
    }
  },
});


updateBoard = function(oldPosition, newPosition) {
  if (rBoard) {
    var board = rBoard.get();
    var boardDifference = getPositionDifference( oldPosition, newPosition );
    board.update(boardDifference);
  }
}

createBoard = function(size) {
  rBoard = new ReactiveVar(
    new WGo.Board(document.getElementById("board"), {
      width: 600,
      size: size,
      background: ""
    })
  );
  return rBoard;
}


var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

removeMDEventHandlers = function(board) {
  if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  var gameId = $(".game-id").attr("id");
  Session.set("MDEventListenerAdded"+gameId, false);
}

addMDEventHandlers = function(board) {
  var gameId = $(".game-id").attr("id");
  var game = Games.findOne(gameId);
  if ( // if we're currently marking dead in this game, and this is a player
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.markingDead() &&
    !Session.get("MDEventListenerAdded"+game._id)
  ) {
    board.addEventListener("click", MDClickHandler = function(x, y) {
      game = Games.findOne(game._id);
      togglePointAsDead(game, x, y);
    });

    Session.set("MDEventListenerAdded"+game._id, true);
  }

}

removeEventHandlers = function(board) {
  if (board) {
    if (boardMouseMoveHandler) board.removeEventListener("mousemove", boardMouseMoveHandler);
    if (boardMouseOutHandler) board.removeEventListener("mouseout", boardMouseOutHandler);
    if (boardClickHandler) board.removeEventListener("click", boardClickHandler);

    var gameId = $(".game-id").attr("id");
    Session.set("eventListenerAdded"+gameId, false);
  }
}

addEventHandlers = function(board) {
  var gameId = $(".game-id").attr("id");
  var game = Games.findOne(gameId);
  if (
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.isReady() &&
    !Session.get("eventListenerAdded"+game._id)
  ) {

    // add hover piece event listener
    board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
      // refresh game data
      var game = Games.findOne(gameId);

      // only if it's your turn
      if (game.isCurrentPlayerMove()) {
        // remove old hoverstone
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);

        // if it's on the board and it's a valid move (no existing piece)
        if (game.wgoGame.isOnBoard(x, y) && game.wgoGame.isValid(x,y)) {
          // add new object
          var newObj = { x: x, y: y, c: game.wgoGame.turn };
          board.addObject(newObj);
          Session.set("hoverStone"+game._id, newObj);
        }
      }
    });

    board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
      board = rBoard.get();
      var game = Games.findOne(gameId);

      if (game.isCurrentPlayerMove()) {
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);
      }
    });

    board.addEventListener("click", boardClickHandler = function(x, y) {
      game = Games.findOne(game._id);

      // invalidate hover piece
      Session.set("hoverStone"+game._id, undefined);

      // play move
      game.playMove(x, y);
    });

    Session.set("eventListenerAdded"+game._id, true);

  }
}
