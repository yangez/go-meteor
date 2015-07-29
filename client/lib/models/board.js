Board = function(attr){
  var board = Object.create(Board.prototype);

  board = _.extend(board, attr);

  return board;
};

_.extend(Board.prototype, {

  // accept: function() {

});
