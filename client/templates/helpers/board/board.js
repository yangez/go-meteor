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
        if (game) {
          updateBoard(game);
        }
      }, 10)
    );
  })(jQuery, ResponsiveBootstrapToolkit);

});

// update board to be equal to #board's width
var updateBoard = function(game) {

  if (!game) return;

  // if there's currently no board, or it's equal to another game, create it
  if (gameBoard === undefined || gameBoard.gameId != game._id) {
    var maxHeight = $(window).height()-20;
    var width = parseInt( $("#board").css("width"));

    // width can't be 0
    if (!width) throw new Meteor.Error("Board width can't be 0.");

    else if (width > maxHeight) width = maxHeight;

    Board.clearBoards();
    gameBoard = new Board(game, width);
  }

  // set new position of the board
  gameBoard.setPosition(game.position());

  // update markers
  gameBoard.updateMDMarkers();
  gameBoard.updateTurnMarker();

  var currentRouteName = Router.current().route.getName();
  if (currentRouteName === "match") {

    gameBoard.clearHover();

    // remove any event handlers
    gameBoard.removeEventHandlers();
    gameBoard.removeMDEventHandlers();

    // add appropriate event handlers to game
    if (game.markingDead()) gameBoard.addMDEventHandlers();
    else if (game.isReady()) gameBoard.addEventHandlers();

  }
}
