Template.historyButtons.onDestroyed(function(){
  Session.set("historyMoveIndex", undefined);
});

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
    var historySession = Session.get("historyMoveIndex");
    return historySession ? historySession.current : this.game.wgoGame.stack.length-1;
  },
  gameLength: function() {
    return this.game.wgoGame.stack.length-1;
  },
  historyUpdate: function() {
    var game = this.game;
    if (!Session.get("historyMoveIndex")) return false;

    var currentIndex = Session.get("historyMoveIndex").current
    var previousIndex = Session.get("historyMoveIndex").previous
    if (rBoard) {
      var board = rBoard.get().board;
      var oldPosition = game.wgoGame.stack[previousIndex];
      var newPosition = game.wgoGame.stack[currentIndex];


      if (oldPosition && newPosition)  {
        // update to new position
        updateBoard(oldPosition, newPosition);

        // remove all other turn markers
        board.removeObjectsOfType("CR");

        // get the previous move
        var previousMove = game.wgoGame.stack[currentIndex-1];
        if (previousMove) {

          // calculate turn marker
          var boardDifference = getPositionDifference( previousMove, newPosition );
          boardDifference.add.forEach(function(object) {
            var turnMarker = { x: object.x, y: object.y, type: "CR" }
            board.addObject(turnMarker);
          });
        }

      }
    }
  },
});

var historyMove = function(game, direction) {
  if (["begin", "back", "forward", "end"].indexOf(direction) === -1)
    var direction = "end";

  // if we don't have a current index, set it to current move
  var lastMoveIndex = game.wgoGame.stack.length-1;

  if (!Session.get("historyMoveIndex"))
    Session.set("historyMoveIndex", {
      current: lastMoveIndex,
      previous: undefined
    });


  var currentMoveIndex = Session.get("historyMoveIndex").current;

  if (direction === "begin") {
    Session.set("historyMoveIndex", {
      current: 0,
      previous: currentMoveIndex
    });
  }
  else if (direction === "back") {
    if (currentMoveIndex === 0) return false;
    Session.set("historyMoveIndex", {
      current: currentMoveIndex-1,
      previous: currentMoveIndex
    });
  }
  else if (direction === "forward") {
    if (currentMoveIndex === lastMoveIndex) return false;
    Session.set("historyMoveIndex", {
      current: currentMoveIndex+1,
      previous: currentMoveIndex
    });
  }
  else if (direction === "end") {
    Session.set("historyMoveIndex", {
      current: lastMoveIndex,
      previous: currentMoveIndex
    });
  }


}
