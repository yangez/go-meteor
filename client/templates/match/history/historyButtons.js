Template.historyButtons.onRendered(function() {
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

    // make popover
    $("#history-move").popover({
      container: "body",
      html: true,
      placement: "left",
      trigger: "manual"
    });
    $('#history-move').on('inserted.bs.popover', function () {
      var $formInput = $("#history-jump-form input");
      $("#history-jump-form").submit(function(e){
        e.preventDefault();
        historyMove(game, "jump", parseInt($formInput.val()));
        $("#history-move").popover('hide');
      });

    });
    $("#history-move").on('shown.bs.popover', function() {
      var $formInput = $("#history-jump-form input");
      $formInput.focus();
      $formInput.select();
    });
    $("html").click(function(e){
      if ($("#history-jump-form").length > 0) {
        $("#history-jump-form").submit();
      }
    });

    // arrow events
    $(document).on('keyup', function(e){
      if (!Session.get("historyMoveIndex")) return false;
      if ([37, 38, 39, 40].indexOf(e.keyCode) === -1) return false;

      e.preventDefault();

      if (e.keyCode === 37) historyMove(game, "back");
      else if (e.keyCode === 39) historyMove(game, "forward");
      else if (e.keyCode === 38) historyMove(game, "begin");
      else if (e.keyCode === 40) historyMove(game, "end");
    });
    // prevent up and down from scrolling
    $(document).on('keydown', function(e) {
      e.preventDefault();
      if ([38, 40].indexOf(e.keyCode) === -1) return false;
    });

});

Template.historyButtons.onDestroyed(function(){
  Session.set("historyMoveIndex", undefined);

  // remove arrow events
  $(document).off('keyup');
  $(document).off('keydown');
});

Template.historyButtons.events({
  'click #history-move': function(e) {
    e.stopPropagation(); e.preventDefault();
    if ($("#history-jump-form").length === 0) {
      $("#history-move").popover('show');
    }
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
    if (gameBoard) {
      var board = gameBoard.board;
      var oldPosition = game.wgoGame.stack[previousIndex];
      var newPosition = game.wgoGame.stack[currentIndex];


      if (oldPosition && newPosition)  {
        // update to new position
        gameBoard.update(oldPosition, newPosition);

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
  if ($("#chat-ingame") && Session.get("messageHistoryState") === 'live') {
    $("#chat-ingame").click();
    $("#chat-ingame input").blur();
  }

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
    if (jumpNumber >= 0 && jumpNumber <= lastMoveIndex) {
      Session.set("historyMoveIndex", {
        current: jumpNumber,
        previous: currentMoveIndex
      });
    }
  }

}
