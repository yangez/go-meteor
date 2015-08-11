Template.historyButtons.onRendered(function() {
    var tData = Template.currentData(this.view);
    var game = tData.game;
    if (!game) return;

    // if we don't have a current index, set it to current move
    if (!Session.get("currentMove")) {
      Session.set("currentMove", game.positionCount()-1);
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
      if (
        Session.get("currentMove") !== undefined &&
        [37, 38, 39, 40].indexOf(e.keyCode) > -1
      ) {
        if (e.keyCode === 37) historyMove(game, "back");
        else if (e.keyCode === 39) historyMove(game, "forward");
        else if (e.keyCode === 38) historyMove(game, "begin");
        else if (e.keyCode === 40) historyMove(game, "end");
      }
    });
    // prevent up and down from scrolling
    $(document).on('keydown', function(e) {
      if ([38, 40].indexOf(e.keyCode) > -1) return false;
    });

});

Template.historyButtons.onDestroyed(function(){
  Session.set("currentMove", undefined);

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
    var currentMove = Session.get("currentMove");
    return currentMove !== undefined ? currentMove : this.game.positionCount()-1;
  },
  gameLength: function() {
    return this.game.positionCount()-1;
  },
  historyUpdate: function() {
    var game = this.game;

    var currentMove = Session.get("currentMove");

    if (gameBoard && currentMove !== undefined) {
      var newPosition = game.positionAt(currentMove+1);
      gameBoard.setPosition(newPosition);

      // remove all other turn markers
      var board = gameBoard.board;
      board.removeObjectsOfType("CR");

      // get the previous move
      var previousMove = game.positionAt(currentMove);
      if (previousMove) {

        // calculate turn marker
        var boardDifference = getPositionDifference( previousMove, newPosition );
        boardDifference.add.forEach(function(object) {
          var turnMarker = { x: object.x, y: object.y, type: "CR" }
          board.addObject(turnMarker);
        });
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

  var lastMove = game.positionCount()-1;
  var currentMove = Session.get("currentMove");

  if (direction === "begin") {
    Session.set("currentMove", 0);
  }
  else if (direction === "back") {
    if (currentMove === 0) return false;
    Session.set("currentMove", currentMove-1);
  }
  else if (direction === "forward") {
    if (currentMove === lastMove) return false;
    Session.set("currentMove", currentMove+1);
  }
  else if (direction === "end") {
    Session.set("currentMove", lastMove);
  }
  else if (direction === "jump") {
    if (jumpNumber >= 0 && jumpNumber <= lastMove) {
      Session.set("currentMove", jumpNumber);
    }
  }

}
