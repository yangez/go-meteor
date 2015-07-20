var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

removeMDEventHandlers = function(board) {
  if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  var gameId = $(".game-id").attr("id");
  Session.set("MDEventListenerAdded"+gameId, false);
}

addMDEventHandlers = function(board) {
  var gameId = $(".game-id").attr("id");
  var game = Games.findOne(gameId);
  if ( // if we're currently marking dead in this game, and this is a player
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.markingDead() &&
    !Session.get("MDEventListenerAdded"+game._id)
  ) {
    board.addEventListener("click", MDClickHandler = function(x, y) {
      game = Games.findOne(game._id);
      game.togglePointAsDead(x, y);
    });

    Session.set("MDEventListenerAdded"+game._id, true);
  }

}

removeEventHandlers = function(board) {
  if (board) {
    if (boardMouseMoveHandler) board.removeEventListener("mousemove", boardMouseMoveHandler);
    if (boardMouseOutHandler) board.removeEventListener("mouseout", boardMouseOutHandler);
    if (boardClickHandler) board.removeEventListener("click", boardClickHandler);

    var gameId = $(".game-id").attr("id");
    Session.set("eventListenerAdded"+gameId, false);
  }
}

addEventHandlers = function(board) {
  var gameId = $(".game-id").attr("id");
  var game = Games.findOne(gameId);
  if (
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.isReady() &&
    !Session.get("eventListenerAdded"+game._id)
  ) {

    // add hover piece event listener
    board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
      // refresh game data
      var game = Games.findOne(gameId);

      // only if it's your turn
      if (game.isCurrentPlayerMove()) {
        // remove old hoverstone
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);

        // if it's on the board and it's a valid move (no existing piece)
        if (game.wgoGame.isOnBoard(x, y) && game.wgoGame.isValid(x,y)) {
          // add new object
          var newObj = { x: x, y: y, c: game.wgoGame.turn };
          board.addObject(newObj);
          Session.set("hoverStone"+game._id, newObj);
        }
      }
    });

    board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
      var game = Games.findOne(gameId);

      if (game.isCurrentPlayerMove()) {
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);
      }
    });

    board.addEventListener("click", boardClickHandler = function(x, y) {
      game = Games.findOne(game._id);

      // invalidate hover piece
      Session.set("hoverStone"+game._id, undefined);

      // play move
      game.playMove(x, y);
    });

    Session.set("eventListenerAdded"+game._id, true);

  }
}
