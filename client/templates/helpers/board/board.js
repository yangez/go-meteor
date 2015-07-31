// declare global board
gameBoard = undefined;

Template.board.onDestroyed(function(e) {
  // unset board so it reinitiates next time
  if (gameBoard) gameBoard = undefined;
});

// on rendered
Template.board.onRendered(function(e){

  // this is run every single time something changes
  this.autorun(function(a) {
    var gameData = Template.currentData();
    if (gameData) var game = Games.findOne(gameData._id);
    if (!game) return;

    var lastMoveIndex = Session.get("boardLastMoveIndex"+game._id);
    var currentMoveIndex = game.wgoGame.stack.length-1;
    Session.set("boardLastMoveIndex"+game._id, currentMoveIndex);

    // if there's currently no board, or it's equal to another game,
    if (gameBoard === undefined || gameBoard.gameId != game._id) {

      // get board size
      var size = parseInt( $("#board").css("width"));

      // regenerate board
      Board.clearBoards();
      gameBoard = new Board(game, size);

      // restore game state from scratch onto new board
      gameBoard.update(game.wgoGame.stack[0], game.wgoGame.getPosition())
    }

    // if board already exists
    else {
      // notify them that it's their turn
      game.notifyCurrentPlayer();

      // update from previous move to latest
      gameBoard.update(game.wgoGame.stack[lastMoveIndex], game.wgoGame.getPosition())
    }

    // update markers
    game.updateMDMarkers(gameBoard);
    game.updateTurnMarker(gameBoard);

    var currentRouteName = Router.current().route.getName();
    if (currentRouteName === "match") {


      game.clearHover(gameBoard);

      // remove any event handlers
      gameBoard.removeEventHandlers();
      gameBoard.removeMDEventHandlers();

      // add appropriate event handlers to game
      if (game.markingDead()) gameBoard.addMDEventHandlers();
      else if (game.isReady()) gameBoard.addEventHandlers();

    }

  });

});
