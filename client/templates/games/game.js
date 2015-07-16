// board display logic
var rBoard, rGame;

createGame = function(game, size, repeat){
  if (["9", "13", "19"].indexOf(size) === -1) {
    console.log("invalid size, using 9");
    size = 9;
  }

  if (!game.wgoGame) {
    var wgoGame = new WGo.Game(size, repeat);
    Games.update({_id: game._id }, { $set: { wgoGame: wgoGame.exportPositions() } });
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
  return rBoard.get();
}

endGame = function(game, method) {
  // check that it's ending because of double pass, or that it's the current user's move
  if (!isCurrentPlayerMove(game) && method != "pass") return false;
  Games.update({_id: game._id}, {$set: {archived: true}});

  var message = (method === "pass") ?
    "Game ended: two consecutive passes." :
    Meteor.user().username+" has ended the game.";

  pushMessage(game, message, GAME_MESSAGE);

  removeEventHandlers(game);
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

hasPlayer = function(game, playerId) {
  if (!game) return false;
  return game.blackPlayerId === Meteor.userId() || game.whitePlayerId === Meteor.userId();
}

isReady = function(game) {
  if (!game.wgoGame) return false;
  if (game.archived) return false;
  if (game.blackPlayerId && game.whitePlayerId) return true;
  return false;
}

GAME_MESSAGE = {gameMessage: true};
pushMessage = function(game, message, user) {
  if (!game) return false;
  if (!game.messages) game.messages = [];

  var username, styleClass;

  if (user) {
    if (user.gameMessage) {
      username = false;
      styleClass = "game-message";
    }
    else if (user.username) username = user.username;
    else username = false;
  }

  var messageObj = {
    author: username,
    content: message,
    class: styleClass
  }

  if (user) // push to collection
    return Games.update({_id: game._id}, {$push: {messages: messageObj}});
  else // push to local collection (goes away when messages updates)
    return Games._collection.update({_id: game._id}, {$push: {messages: messageObj}})
}

removeEventHandlers = function(game, board) {
  if (!board) var board = rBoard.get();
  board.removeEventListener("mousemove", boardMouseMoveHandler);
  board.removeEventListener("mouseout", boardMouseOutHandler);
  board.removeEventListener("click", boardClickHandler);
}

addEventHandlers = function(game, board) {
  //if (Meteor.user() && gameHasPlayer(game, Meteor.user()) && isReady(game)) {
  if (Meteor.user() && gameHasPlayer(game, Meteor.user()) && isReady(game)) {
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

    Session.set("eventListenerAdded", true);

  }
}

// onRendered
Template.board.onRendered(function(e){
  gameData = this.data; // make this responsive

  createGame(gameData, gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  if (game.boardState) board.restoreState(game.boardState);

  addEventHandlers(game, board);

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
  'loginRefresh': function() {
    if (Meteor.user()) {
      var game = Games.findOne(this._id);
      if (rBoard) {
        if (!Session.get("eventListenerAdded")) {
          var board = rBoard.get();
          addEventHandlers(game, board);
        }
      }
    }
  }
});
