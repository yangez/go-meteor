Board = function(game){
  var board = Object.create(Board.prototype);

  $("#board").html(""); // kill all other boards
  board = _.extend(board, {
    gameId: game._id,
    board: new WGo.Board(document.getElementById("board"), {
      width: 600,
      size: game.size,
      background: ""
    })
  });

  return board;
};

_.extend(Board.prototype, {


});
