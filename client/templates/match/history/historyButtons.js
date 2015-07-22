Template.historyButtons.onRendered(function() {
  // this.autorun(function(a) {
    var tData = Template.currentData(this.view);
    var game = tData.game;
    if (!game) return;

    // if we don't have a current index, set it to current move

    if (!Session.get("historyMoveIndex")) {
      var lastMoveIndex = game.wgoGame.stack.length-1;
      Session.set("historyMoveIndex", {
        current: lastMoveIndex,
        previous: undefined
      });
    }
  // });
});

Template.historyButtons.onDestroyed(function(){
  Session.set("historyMoveIndex", undefined);
});

Template.historyButtons.events({
  'click #history-move': function(e) {
    e.preventDefault();
    historyMove(this.game, "jump", 4);
  },
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

var historyMove = function(game, direction, jumpNumber) {
  if (["begin", "back", "forward", "end", "jump"].indexOf(direction) === -1)
    var direction = "end";

  // move to history chat tab
  if ($("#chat-ingame")) $("#chat-ingame").click();

  var lastMoveIndex = game.wgoGame.stack.length-1;
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
  else if (direction === "jump") {
    if (jumpNumber > 0 && jumpNumber < lastMoveIndex) {
      Session.set("historyMoveIndex", {
        current: jumpNumber,
        previous: currentMoveIndex
      });
    }
  }

}
