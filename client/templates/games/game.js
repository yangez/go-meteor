// board display logic
var rBoard;

// on rendered
Template.board.onRendered(function(e){
  gameData = this.data;

  createGame(gameData, gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  if (game.boardState) board.restoreState(game.boardState);

  // add appropriate event handlers to game
  if (markingDead(game)) addMDEventHandlers(game, board);
  else if (isReady(game)) addEventHandlers(game, board);

});


createGame = function(game, size, repeat){
  if (["9", "13", "19"].indexOf(size) === -1) {
    console.log("invalid size, using 9");
    size = 9;
  }

  if (!game.wgoGame) {
    var wgoGame = new WGo.Game(size, repeat);
    Games.update({_id: game._id }, { $set: { wgoGame: wgoGame.exportPositions(), messages:[] } });
  }

  return Games.findOne(game._id);
};

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

  // push markDead message
  pushMessage(game, "You and your opponent should now mark dead stones by clicking. When you're satisfied, press Accept. To play it out, press Decline.");

  // duplicate our schema so we can mark stones as dead
  markedSchema = _.clone(game.wgoGame.getPosition().schema);

  // set game to markDead mode, set markedSchema to markedSchema
  Games.update({_id: game._id}, {$set: {markedDead: true, markedSchema: markedSchema} });

  return true;

}

endGame = function(game, method) {
  // check that it's ending because of double pass, or that it's the current user's move
  if (!isCurrentPlayerMove(game) && method != "pass") return false;

  var message = (method === "pass") ?
    "Game ended: two consecutive passes." :
    Meteor.user().username+" has ended the game.";

  pushMessage(game, message, GAME_MESSAGE);

  // if game hasn't had a markdead stage yet, do the markdead stage
  if (!game.markedDead) markDead(game);

  // if we've already marked dead once, end game immediately
  else {
    Games.update({_id: game._id}, {$set: {archived: true}});

    var score = game.wgoGame.scorePosition();
    var scoreMessage = "Final score: "+score+".";
    pushMessage(game, scoreMessage, GAME_MESSAGE);
  }

  return true;
}

playPass = function(game) {
  if (!isCurrentPlayerMove(game)) return false;
  playMove(game, "pass");

  // end game if three positions at end of stack are the same
  // (meaning two passes were played consecutively)
  var game = Games.findOne(game._id);
  var lastThreePositions = _.last(game.wgoGame.stack, 3);
  if (lastThreePositions.length != 3) return;
  if (
    _.isEqual(lastThreePositions[0].schema, lastThreePositions[1].schema) &&
    _.isEqual(lastThreePositions[0].schema, lastThreePositions[2].schema)
  ) endGame(game, "pass");
}

playMove = function(game, x,y) {
  var game = Games.findOne(game._id);
  var wgoGame = game.wgoGame;
  board = rBoard.get();

  // if game isn't created, return
  if (!wgoGame) return alert("Game hasn't been created yet.");
  if (game.archived) return pushMessage(game, "The game has ended.");
  if (!isReady(game)) return pushMessage(game, "You need an opponent first.");
  if (!isPlayerTurn(game)) return pushMessage(game, "It's your opponent's turn.");

  if (x==="pass") { // if we're playing a pass
    wgoGame.pass();
    pushMessage(game, Meteor.user().username+" has passed.", GAME_MESSAGE)
  } else { // if we're playing a real move

    var captured = wgoGame.play(x,y);

    if (typeof captured !== "object") {
      if (captured === 1) return false;
      var msg = "An unknown error occurred.";
      if (captured === 2) msg = "There's already a stone here.";
      if (captured === 3) msg = "That move would be suicide.";
      if (captured === 4) msg = "That move would repeat a previous position.";
      return pushMessage(game, msg);
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
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions(), boardState: state, previousMarker: turnMarker } });

  return game;
}

isPlayerTurn = function(game, playerId) {
  if (!game || !game.wgoGame) return false;

  if (!playerId) var playerId = Meteor.userId();

  if (game.wgoGame.turn === WGo.B) {
    if (game.blackPlayerId === playerId) return true;
  } else if (game.wgoGame.turn == WGo.W) {
    if (game.whitePlayerId === playerId) return true;
  } else return false;
}

// Game does not contain message
/*
noGameMessage = function(game, message) {
  if (!game) return false;
  var game = Games.findOne(game._id);
  if (!game.messages || game.messages.length < 1) return true;

  // one of these needs to return true for a match
  var gameMessageMatched = game.messages.some(function (msg) {
    if (msg.author) return false; // if there's an author, it's not a game message
    return (msg.content.indexOf(message) != -1);
  });

  return !gameMessageMatched;
},
*/

togglePointAsDead = function(game, x, y) {
  console.log(x+","+y);
}


var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

removeMDEventHandlers = function(game, board) {
  if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  Session.set("MDEventListenerAdded"+game._id, false);
}

addMDEventHandlers = function(game, board) {
  if ( // if we're currently marking dead in this game, and this is a player
    gameHasPlayer(game, Meteor.user()) &&
    markingDead(game) &&
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
    gameHasPlayer(game, Meteor.user()) &&
    isReady(game) &&
    !Session.get("eventListenerAdded"+game._id)
  ) {
    // add hover piece event listener
    board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
      // refresh game data
      game = Games.findOne(game._id);
      board = rBoard.get();

      // only if it's your turn
      if (isPlayerTurn(game, Meteor.userId())) {
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

      if (isPlayerTurn(game, Meteor.userId())) {
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
    if (Meteor.user()) {
      var game = Games.findOne(this._id);
      if (rBoard) { // if board exists

        var board = rBoard.get();

        // if we finished the game, remove all event handlers
        if (game.archived) {
          removeEventHandlers(game, board);
          removeMDEventHandlers(game, board);
        }

        // add marking dead event handlers if we're marking dead
        else if (markingDead(game)) {
          removeEventHandlers(game, board);
          addMDEventHandlers(game, board);
        }

        // add game event handlers if we're playing the game
        else {
          removeMDEventHandlers(game, board);
          addEventHandlers(game, board);
        }
      }
    }
  },
});
