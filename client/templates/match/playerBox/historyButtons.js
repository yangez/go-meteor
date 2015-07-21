Template.historyButtons.events({
  'click #history-begin': function(e) {
    e.preventDefault();
    historyMove(this.game, "begin");
  },
  'click #history-back': function(e) {
    e.preventDefault();
    historyMove(this.game, "back");
  },
  'click #history-forward': function(e) {
    e.preventDefault();
    historyMove(this.game, "forward");
  },
  'click #history-end': function(e) {
    e.preventDefault();
    historyMove(this.game, "end");
  },

});

Template.historyButtons.helpers({
  currentMoveNumber: function() {
    var historySession = Session.get("historyMoveIndex"+this.game._id);
    return historySession ? historySession.current : this.game.wgoGame.stack.length-1;
  },
  gameLength: function() {
    return this.game.wgoGame.stack.length-1;
  },
  historyUpdate: function() {
    var game = this.game;
    if (!Session.get("historyMoveIndex"+game._id)) return false;

    var currentIndex = Session.get("historyMoveIndex"+game._id).current
    var previousIndex = Session.get("historyMoveIndex"+game._id).previous
    if (rBoard) {
      var board = rBoard.get();
      var oldPosition = game.wgoGame.stack[previousIndex];
      var newPosition = game.wgoGame.stack[currentIndex];

      if (oldPosition && newPosition) updateBoard(oldPosition, newPosition);
    }
  },
});

var historyMove = function(game, direction) {
  if (["begin", "back", "forward", "end"].indexOf(direction) === -1)
    var direction = "end";

  // if we don't have a current index, set it to current move
  var lastMoveIndex = game.wgoGame.stack.length-1;

  if (!Session.get("historyMoveIndex"+game._id))
    Session.set("historyMoveIndex"+game._id, {
      current: lastMoveIndex,
      previous: undefined
    });


  var currentMoveIndex = Session.get("historyMoveIndex"+game._id).current;

  if (direction === "begin") {
    Session.set("historyMoveIndex"+game._id, {
      current: 0,
      previous: currentMoveIndex
    });
  }
  else if (direction === "back") {
    if (currentMoveIndex === 0) return false;
    Session.set("historyMoveIndex"+game._id, {
      current: currentMoveIndex-1,
      previous: currentMoveIndex
    });
  }
  else if (direction === "forward") {
    if (currentMoveIndex === lastMoveIndex) return false;
    Session.set("historyMoveIndex"+game._id, {
      current: currentMoveIndex+1,
      previous: currentMoveIndex
    });
  }
  else if (direction === "end") {
    Session.set("historyMoveIndex"+game._id, {
      current: lastMoveIndex,
      previous: currentMoveIndex
    });
  }


}
