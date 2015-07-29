// board display logic
gameBoard = undefined;

Template.board.onDestroyed(function(e) {
  // unset board so it reinitiates next time
  if (gameBoard) gameBoard = undefined;
});

// on rendered
Template.board.onRendered(function(e){

  // this is run every single time something changes
  this.autorun(function(a) {
    var game = Template.currentData(this.view);
    if (!game) return;

    // if there's currently no board, or it's equal to another game,
    if (gameBoard === undefined || gameBoard.gameId != game._id) {

      // regenerate board
      gameBoard = new Board(game);

      // restore game state from scratch onto new board
      updateBoard(game.wgoGame.stack[0], game.wgoGame.getPosition());

    } else {

      // if they've already been on the page, notify them that it's their turn
      game.notifyCurrentPlayer();

    }

    var board = gameBoard.board;

    // update markers
    game.updateMDMarkers(board);
    game.updateTurnMarker(board);
    game.clearHover(board);

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
  if (gameBoard) {
    var board = gameBoard.board;
    var boardDifference = getPositionDifference( oldPosition, newPosition );
    board.update(boardDifference);
  }
}
