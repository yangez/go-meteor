// board display logic
var rBoard;

// on rendered
Template.board.onRendered(function(e){
  gameData = this.data;

  gameData.createGame(gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  if (game.boardState) board.restoreState(game.boardState);

  // remove any event handlers, set correct session variables
  removeEventHandlers(game, board);
  removeMDEventHandlers(game, board);

  // add appropriate event handlers to game
  if (game.markingDead()) addMDEventHandlers(game, board);
  else if (game.isReady()) addEventHandlers(game, board);

});

Template.board.helpers({
  'restoreState' : function(){
    // game stuff
    var gameObj = Games.findOne(this._id);

    if (rBoard) var board = rBoard.get();
    if (board && gameObj && gameObj.boardState) {
      board.restoreState(gameObj.boardState);
    }
  },
  'eventRefresh': function() {
    var game = Games.findOne(this._id);
    if (Meteor.user()) {
      if (rBoard) { // if board exists

        var board = rBoard.get();

        // if game state is finished, remove all event handlers
        if (game.archived) {
          removeEventHandlers(game, board);
          removeMDEventHandlers(game, board);
        }

        // if game state is marking dead, add marking dead event handlers
        else if (game.markingDead()) {
          removeEventHandlers(game, board);
          addMDEventHandlers(game, board);
        }

        // if game state is playing, add game event handlers
        else {
          removeMDEventHandlers(game, board);
          addEventHandlers(game, board);
        }
      }
    }
  },
});


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

getFinalScore = function(game) {
  // if game has a marked schema (MD was accepted), return the marked score
  if (game.markedSchema) {
    var markedPosition = _.clone(game.wgoGame.getPosition());
    markedPosition.schema = game.markedSchema;
    return markedPosition.formattedScore();
  } else { // if game doesn't have marked schema (MD was declined), return top position's score
    return game.wgoGame.getPosition().formattedScore();
  }

}

playPass = function(game) {
  if (!game.isCurrentPlayerMove()) return false;
  playMove(game, "pass");

  // end game if two passes were played consecutively
  var game = Games.findOne(game._id);
  var lastThreePositions = _.last(game.wgoGame.stack, 3);
  if (lastThreePositions.length != 3) return;
  if (
    _.isEqual(lastThreePositions[0].schema, lastThreePositions[1].schema) &&
    _.isEqual(lastThreePositions[0].schema, lastThreePositions[2].schema)
  ) game.endGame();
}

playMove = function(game, x,y) {
  var game = Games.findOne(game._id);
  var wgoGame = game.wgoGame;
  board = rBoard.get();

  // if game isn't created, return
  if (!wgoGame) return alert("Game hasn't been created yet.");
  if (game.archived) return game.pushMessage("The game has ended.");
  if (!game.isReady()) return game.pushMessage("You need an opponent first.");
  if (!game.isCurrentPlayerMove()) return game.pushMessage("It's your opponent's turn.");

  if (x==="pass") { // if we're playing a pass
    wgoGame.pass();
    game.pushMessage(Meteor.user().username+" has passed.", GAME_MESSAGE)
  } else { // if we're playing a real move

    var captured = wgoGame.play(x,y);

    if (typeof captured !== "object") {
      if (captured === 1) return false;
      var msg = "An unknown error occurred.";
      if (captured === 2) msg = "There's already a stone here.";
      if (captured === 3) msg = "That move would be suicide.";
      if (captured === 4) msg = "That move would repeat a previous position.";
      return game.pushMessage(msg);
    }

    // invalidate hover piece on board
    var oldObj = Session.get("hoverStone"+game._id);
    Session.set("hoverStone"+game._id, undefined);
    if (oldObj) board.removeObject(oldObj);

    // reverse turn color (because we already played it)
    var turn = (wgoGame.turn === WGo.B) ? WGo.W : WGo.B;

    // add move on board
    board.addObject({
      x: x,
      y: y,
      c: turn
    });

    // remove captured pieces from board
    captured.forEach(function(obj) {
      board.removeObject(obj);
    });

    // add last move marker to board
    var turnMarker = { x: x, y: y, type: "CR" }
    board.addObject(turnMarker);
  }

  // remove previous marker if it exists
  var previousTurnMarker = game.previousMarker;
  if (previousTurnMarker) board.removeObject(previousTurnMarker);

  // update state and game position in collection
  var state = board.getState();
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions(), boardState: state, previousMarker: turnMarker, lastActivityAt: new Date() } });

  return game;
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

removeMDEventHandlers = function(game, board) {
  if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  Session.set("MDEventListenerAdded"+game._id, false);
}

addMDEventHandlers = function(game, board) {
  if ( // if we're currently marking dead in this game, and this is a player
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

removeEventHandlers = function(game, board) {
  if (board) {
    if (boardMouseMoveHandler) board.removeEventListener("mousemove", boardMouseMoveHandler);
    if (boardMouseOutHandler) board.removeEventListener("mouseout", boardMouseOutHandler);
    if (boardClickHandler) board.removeEventListener("click", boardClickHandler);

    Session.set("eventListenerAdded"+game._id, false);
  }
}

addEventHandlers = function(game, board) {
  if ( // if this is a playable game with current user as one of the players
    game.hasPlayer(Meteor.user()) &&
    game.isReady() &&
    !Session.get("eventListenerAdded"+game._id)
  ) {
    // add hover piece event listener
    board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
      // refresh game data
      game = Games.findOne(game._id);
      board = rBoard.get();

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
      game = Games.findOne(game._id);
      board = rBoard.get();

      if (game.isCurrentPlayerMove()) {
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);
      }
    });

    board.addEventListener("click", boardClickHandler = function(x, y) {
      game = Games.findOne(game._id);
      playMove(game, x, y);
    });

    Session.set("eventListenerAdded"+game._id, true);

  }
}
