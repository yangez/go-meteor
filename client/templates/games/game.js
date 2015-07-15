// board display logic
var rBoard, rGame;

createGame = function(game, size, repeat){
  if (["9", "13", "19"].indexOf(size) === -1) {
    console.log("invalid size, using 9");
    size = 9;
  }

  if (game.wgoGame) return console.log("game exists");
  else console.log("creating game...")

  console.log("game created with size "+size);
  var wgoGame = new WGo.Game(size, repeat);

  Games.update({_id: game._id }, { $set: { wgoGame: wgoGame.exportPositions() } });

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

playMove = function(game, x,y) {
  // play the move
  var game = Games.findOne(game._id);
  var wgoGame = game.wgoGame;
  board = rBoard.get();

  // if game isn't created, return
  if (!wgoGame) return alert("Game hasn't been created yet.");
  if (!isReady(game)) return pushMessage(game, "You need an opponent first.");
  if (!isPlayerTurn(game)) return pushMessage(game, "It's your opponent's turn.");

  var captured = wgoGame.play(x,y);

  if (typeof captured !== "object") {
    var msg = "An unknown error occurred.";
    if (captured === 1) msg = "This coordinate doesn't exist.";
    if (captured === 2) msg = "There's already a stone here.";
    if (captured === 3) msg = "That move would be suicide.";
    if (captured === 4) msg = "That move would repeat a previous position.";
    return pushMessage(game, msg);
  }

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

  // update state and game position in collection
  var state = board.getState();
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions(), boardState: state } });

  return game;
}

isPlayerTurn = function(game, playerId) {
  if (!game.wgoGame) return false;

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
  if (game.blackPlayerId && game.whitePlayerId) return true;
  return false;
}

pushMessage = function(game, message, user) {
  if (!game) return false;
  if (!game.messages) game.messages = [];
  var username = user ? user.username : false;
  var messageObj = {
    author: username,
    content: message
  }

  if (user) // push to collection
    return Games.update({_id: game._id}, {$push: {messages: messageObj}});
  else // push to local collection (goes away when messages updates)
    return Games._collection.update({_id: game._id}, {$push: {messages: messageObj}})
}

// onRendered
Template.board.onRendered(function(e){
  gameData = this.data;

  createGame(gameData, gameData.size, gameData.repeat);
  createBoard(gameData.size);

  var game = Games.findOne(gameData._id);
  var board = rBoard.get();

  if (gameData.boardState) board.restoreState(gameData.boardState);

  if (Meteor.user()) {
    board.addEventListener("click", function(x, y) {
      playMove(gameData, x, y);
    });
    Session.set("eventListenerAdded", true);
  }
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
      var game = this;
      if (rBoard) {
        if (!Session.get("eventListenerAdded")) {
          var board = rBoard.get();
          board.addEventListener("click", function(x, y) {
            playMove(game, x, y);
          });
          Session.set("eventListenerAdded", true);
        }
      }
    }
  }
});
