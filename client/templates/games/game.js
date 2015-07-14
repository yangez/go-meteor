// Transform game model
wgoTransform = function(game) {
}


// board display logic
var rBoard, rGame;

createGame = function(game, size, repeat){
  if (size === "9x9") { size = 9; }

  if (game.wgoGame) return console.log("game exists");
  else console.log("creating game...")

  var wgoGame = new WGo.Game(size, repeat);

  Games.update({_id: game._id }, { $set: { wgoGame: wgoGame.exportPositions() } });

  return Games.findOne(game._id);
};

createBoard = function() {
  rBoard = new ReactiveVar(
    new WGo.Board(document.getElementById("board"), {
      width: 600,
      size: 9
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

  if (!isPlayerTurn(game)) return console.log("lol it's not your turn");

  var result = wgoGame.play(x,y);

  if (typeof result !== "object")
    return alert(result);

  board.addObject({
    x: x,
    y: y,
    c: wgoGame.turn
  });


  var state = board.getState();
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions(), boardState: state } });

  return game;
}

isPlayerTurn = function(game) {
  if (game.wgoGame.turn === WGo.B) {
    if (game.blackPlayerId == Meteor.userId()) return true;
  } else if (game.wgoGame.turn == WGo.W) {
    if (game.whitePlayerId == Meteor.userId()) return true;
  } else return false;
}


// onRendered
Template.board.onRendered(function(e){
  var gameData = this.data;

  var game = createGame(gameData, gameData.size, gameData.repeat);
  var board = createBoard();

  if (gameData.boardState) board.restoreState(gameData.boardState);

  board.addEventListener("click", function(x, y) {
    playMove(gameData, x, y);
  });
});

Template.board.events({
  'click #start-game' : function() {

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
  }
});
