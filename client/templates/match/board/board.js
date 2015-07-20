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
