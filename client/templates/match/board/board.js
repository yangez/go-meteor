// board display logic
rBoard = undefined;

Template.board.onDestroyed(function(e) {
  // unset board so it reinitiates next time
  if (rBoard) rBoard = undefined;
});

// on rendered
Template.board.onRendered(function(e){

  // this is run every single time something changes
  this.autorun(function(a) {
    var game = Template.currentData(this.view);
    if (!game) return;

    // if there's currently no board, or it's equal to another game,
    // generate stuff for the first time
    if (rBoard === undefined || rBoard.get().gameId != game._id) {

      game.createGame(game.size, game.repeat);
      createBoard(game);

      // restore game state from scratch onto new board
      if (game.wgoGame) updateBoard(game.wgoGame.stack[0], game.wgoGame.getPosition());
    }

    var board = rBoard.get().board;

    // update markers
    game.updateMDMarkers(board);
    game.updateTurnMarker(board);

    // remove any event handlers
    removeEventHandlers(board);
    removeMDEventHandlers(board);

    // add appropriate event handlers to game
    if (game.markingDead()) addMDEventHandlers(board, game);
    else if (game.isReady()) addEventHandlers(board, game);


  });

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
  },
});


updateBoard = function(oldPosition, newPosition) {
  if (rBoard) {
    var board = rBoard.get().board;
    var boardDifference = getPositionDifference( oldPosition, newPosition );
    board.update(boardDifference);
  }
}

createBoard = function(game) {
  $("#board").html(""); // kill all other boards
  rBoard = new ReactiveVar({
    gameId: game._id,
    board: new WGo.Board(document.getElementById("board"), {
      width: 600,
      size: game.size,
      background: ""
    })
  }
  );
  return rBoard;
}
