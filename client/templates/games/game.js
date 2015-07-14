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

  return game;
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
  var wgoGame = game.wgoGame;

  if (!wgoGame)
    return alert("Game hasn't been created yet.");

  var result = wgoGame.play(x,y);

  // if result = successful, set position in the game
  Games.update({_id: game._id}, { $set: { wgoGame: wgoGame.exportPositions() } });

  // update the ReactiveVar
  // rGame.set({ idrGame._id, game);
  return game;
}

updateBoard = function() {
  // update the board here based on the game data
}



// onRendered
Template.board.onRendered(function(e){
  var gameData = this.data;

  var game = createGame(gameData, gameData.size, gameData.repeat);
  var board = createBoard();


  if (gameData.state) board.restoreState(gameData.state);

  var tool = document.getElementById("tool"); // get the <select> element

  board.addEventListener("click", function(x, y) {
    if(tool.value == "black") {
      playMove(gameData, x,y);
      // console.log(game);

      board.addObject({
        x: x,
        y: y,
        c: WGo.B
      });
    }
    else if(tool.value == "white") {
      board.addObject({
        x: x,
        y: y,
        c: WGo.W
      });
    }
    else if(tool.value == "remove") {
      board.removeObjectsAt(x, y);
    }
    else {
      board.addObject({
        x: x,
        y: y,
        type: tool.value
      });
    }
    var state = board.getState();
    Games.update({_id: gameData._id }, { $set: { state: state } });

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
      // console.log("Restoring position... ");
      // console.log(gameObj.wgoGame);
    }

    // if (board && gameObj && gameObj.position) {
    // }

    // board stuff
    // if (rBoard) var board = rBoard.get();
    // if (board && gameObj && gameObj.state) {
      // board.restoreState(gameObj.state);
    // }
  }
});
