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
  var updatedGame = Games.findOne(game._id);
  var wgoGame = updatedGame.wgoGame;

  if (!wgoGame)
    return alert("Game hasn't been created yet.");

  board = rBoard.get();
  board.addObject({
    x: x,
    y: y,
    c: wgoGame.turn
  });

  var result = wgoGame.play(x,y);

  if (typeof result !== "object")
    return alert(result);

  var state = board.getState();
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions(), state: state } });

  Session.set("boardRefreshed", false);
  return updatedGame;
}



// onRendered
Template.board.onRendered(function(e){
  var gameData = this.data;

  var game = createGame(gameData, gameData.size, gameData.repeat);
  var board = createBoard();

  if (gameData.state) board.restoreState(gameData.state);

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

    if (gameObj.wgoGame) {
      if (!Session.get("boardRefreshed")) {
        Session.set("boardRefreshed", true);
        console.log("Restoring position...");
        if (rBoard) var board = rBoard.get();

        if (board && gameObj && gameObj.state) {
          console.log("really restoring...")
          board.restoreState(gameObj.state);
          rBoard.set(board);
        }
      }
    }

  }
});
