var MDClickHandler, boardMouseMoveHandler, boardMouseOutHandler, boardClickHandler;

removeMDEventHandlers = function(board) {
  if (MDClickHandler) board.removeEventListener("click", MDClickHandler);
  var gameId = $(".game-id").attr("id");
}

addMDEventHandlers = function(board, game) {
  if ( // if we're currently marking dead in this game, and this is a player
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.markingDead()
  ) {
    board.addEventListener("click", MDClickHandler = function(x, y) {
      // game = Games.findOne(game._id);

      Meteor.call('game/action', game._id, "togglePointAsDead", {x: x, y: y}, function(error, result) {
        if (error) console.log(error.message);
      });

    });
  }

}

removeEventHandlers = function(board) {
  if (board) {
    if (boardMouseMoveHandler) board.removeEventListener("mousemove", boardMouseMoveHandler);
    if (boardMouseOutHandler) board.removeEventListener("mouseout", boardMouseOutHandler);
    if (boardClickHandler) board.removeEventListener("click", boardClickHandler);
  }
}

addEventHandlers = function(board, game) {
  if (
    game &&
    game.hasPlayer(Meteor.user()) &&
    game.isReady()
  ) {
    // add hover piece event listener
    board.addEventListener("mousemove", boardMouseMoveHandler = function(x, y){
      // refresh game data
      // var gameId = $(".game-id").attr("id");
      game = Games.findOne(game._id);

      // only if it's your turn
      if (game.isCurrentPlayerMove()) {
        // remove old hoverstone
        var oldObj = Session.get("hoverStone"+game._id);
        Session.set("hoverStone"+game._id, undefined);
        if (oldObj) board.removeObject(oldObj);

        // if it's on the board and it's a valid move (no existing piece)
        if (game.wgoGame.isOnBoard(x, y) && game.wgoGame.isValid(x,y)) {
          // add new object
          if (game.wgoGame.turn === WGo.B) {
            var newObj = { x: x, y: y, type: "BLACK_HOVER" };
          } else {
            var newObj = { x: x, y: y, type: "WHITE_HOVER" };
          }
          board.addObject(newObj);
          Session.set("hoverStone"+game._id, newObj);
        }
      }
    });

    board.addEventListener("mouseout", boardMouseOutHandler = function(x, y) {
      game = Games.findOne(game._id);

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
      Meteor.call('game/action', game._id, "playMove", {x: x, y: y}, function(error, result) {
        if (error) console.log(error.message);
      });
    });

  }
}
