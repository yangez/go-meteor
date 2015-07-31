// declare global board
gameBoard = undefined;

Template.board.onDestroyed(function(e) {
  // unset board so it reinitiates next time
  if (gameBoard) gameBoard = undefined;
});

// on rendered
Template.board.onRendered(function(e){
  // every time Game changes, update board
  this.autorun(function(a) {
    var gameData = Template.currentData();
    if (gameData) var game = Games.findOne(gameData._id);
    updateBoard(game);
  });

  // Every time browser size changes, regenerate board
  // this is the weirdass syntax required by the library
  (function($, viewport){
    $(window).resize(
      viewport.changed(function(){
        var game = Games.findOne(gameBoard.gameId);
        gameBoard = undefined;
        if (game) updateBoard(game);
      }, 10)
    );
  })(jQuery, ResponsiveBootstrapToolkit);

});

var updateBoard = function(game) {

  if (!game) return;

  var lastMoveIndex = Session.get("boardLastMoveIndex"+game._id);
  var currentMoveIndex = game.wgoGame.stack.length-1;
  Session.set("boardLastMoveIndex"+game._id, currentMoveIndex);

  // if there's currently no board, or it's equal to another game,
  if (gameBoard === undefined || gameBoard.gameId != game._id) {
    var size = parseInt( $("#board").css("width"));
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
}
