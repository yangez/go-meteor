// board display logic
var rBoard;

// on rendered
Template.board.onRendered(function(e){
  gameData = this.data;

  gameData.createGame(gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  // restore previous game state
  if (game.wgoGame) {
    updateBoard(game.wgoGame.stack[0], game.wgoGame.getPosition());
  }

  // remove any event handlers, set correct session variables
  removeEventHandlers(board);
  removeMDEventHandlers(board);

  // add appropriate event handlers to game
  if (game.markingDead()) addMDEventHandlers(board);
  else if (game.isReady()) addEventHandlers(board);

});

Template.board.helpers({
  'restoreState' : function(){
    // game stuff
    var oldGame = this;
    var newGame = Games.findOne(this._id);
    updateBoard(oldGame.wgoGame.getPosition(), newGame.wgoGame.getPosition());
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


markDead = function(game) {
  var game = Games.findOne(game._id);

  // duplicate our schema so we can mark stones as dead
  markedSchema = _.clone(game.wgoGame.getPosition().schema);

  // get original board state so we can revert to it if someone declines
  var board = rBoard.get();
  originalBoardState = board.getState();

  // set game to markDead mode, set markedSchema to markedSchema
  Games.update({_id: game._id}, {$set: {
    markedDead: true,
    markedSchema: markedSchema,
    originalBoardState: originalBoardState
  } });

  return true;

}


togglePointAsDead = function(game, x, y) {
  if (!game.markedSchema) return false;

  var board = rBoard.get(),
      marked = game.markedSchema;
      original = game.wgoGame.getPosition().schema,
      originalBoardState = board.getState(),
      changed = false;

  var index = convertCoordinatesToSchemaIndex(original, x, y);
  if (index) { // if point exists

    // unaccept markDead on behalf of all players
    game.clearAcceptMD();

    var marker = { x: x, y: y, type: "DEAD" }

    /* if point is the same as the original && point is set to either white or black
        set point to neutral in marked */
    if (
      marked[index] === original[index] &&
      [-1, 1].indexOf(marked[index]) > -1
    ) {
      marked[index] = 0; changed = true;
      board.addObject(marker);
    }

    /* else if point is different than the original
    set point to the original in marked */
    else if (marked[index] != original[index]) {
      marked[index] = original[index]; changed = true;
      board.removeObject(marker);
    }

    // write to DB if something changed
    if (changed) {
      var state = board.getState();
      Games.update({_id: game._id}, {$set: {markedSchema: marked, boardState: state}});
    }

  }

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

      // only if it's your turn
      if (game.isCurrentPlayerMove()) {
        // remove old hoverstone
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);

        // if it's on the board and it's a valid move (no existing piece)
        if (game.wgoGame.isOnBoard(x, y) && game.wgoGame.isValid(x,y)) {
          // add new object
          var newObj = { x: x, y: y, c: game.wgoGame.turn, note: "hover" };
          board.addObject(newObj);
          Session.set("hoverStone"+game._id, newObj);
        }
      }
    });

    board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
      board = rBoard.get();

      if (game.isCurrentPlayerMove()) {
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);
      }
    });

    board.addEventListener("click", boardClickHandler = function(x, y) {
      game = Games.findOne(game._id);
      game.playMove(x, y);
    });

    Session.set("eventListenerAdded"+game._id, true);

  }
}
