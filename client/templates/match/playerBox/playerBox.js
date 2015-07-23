Template.playerBox.helpers({
  data: function() {
    var currentUserColor = this.game.getColorOfPlayerId(Meteor.userId());

    // if current user is part of this game
    if (currentUserColor) {
      if (this.position === "bottom") { // bottom: show current user
        return {
          user: Meteor.user(),
          isCurrentPlayer: true,
          color: currentUserColor
        }
      } else if (this.position === "top") { // top: show opponent
        opponentColor = getOppositeColor(currentUserColor);
        opponent = this.game.getPlayerAtColor(opponentColor);

        if (opponent) return {
          user: opponent,
          isCurrentPlayer: false,
          color: opponentColor
        }
        else return { color: opponentColor };
      }
    }

    // if current user not part of this game (or no current user)
    else {
      if (this.position === "bottom") {
        var blackPlayer = this.game.getPlayerAtColor("black");

        // if black player exists, show username
        if (blackPlayer) return {
          user: blackPlayer,
          isCurrentPlayer: false,
          color: "black"
        };
        // if black player doesn't exist, prompt current user to join game
        else {
          // if logged in, show button
          if (Meteor.user()) return {
            joinButton: true,
            color: "black"
          };
          else return {
            joinPrompt: true,
            color: "black"
          };
        }

      } else if (this.position === "top") {
        var whitePlayer = this.game.getPlayerAtColor("white");

        if (whitePlayer) return {
          user: whitePlayer,
          isCurrentPlayer: false,
          color: "white"
        };
        // if white player doesn't exist, prompt current user to join game
        else {
          // if logged in, show button
          if (Meteor.user()) return {
            joinButton: true,
            color: "white"
          };
          else return {
            joinPrompt: true,
            color: "white"
          };
        }
      }

    }

    return {}; // default return empty object

  },
  userIsOnline: function() {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    var object = Presences.findOne({userId: user._id});
    return (object && object.state === "online");
  },
  isBottom: function() {
    return this.position == "bottom";
  },
  gameEnded: function() {
    return this.game.archived;
  },
  playerTurn: function() {
    // if game is actually playing
    if (this.game.isReady()) {
      var color = this.game.getColorOfPosition(this.position);
      if (
        (this.game.wgoGame.turn === -1 && color === "white") ||
        (this.game.wgoGame.turn === 1 && color === "black")
      ) return "player-turn";
    }
    // if game is completed (and we're viewing history)
    else if (this.game.archived) {
      var historySession = Session.get("historyMoveIndex");

      if (
        historySession &&
        historySession.current !== undefined &&
        historySession.current < this.game.wgoGame.stack.length-1
      ) {

        var color = this.game.getColorOfPosition(this.position);

        var boardPosition = this.game.wgoGame.stack[historySession.current];


        if (
          historySession.current === 0 &&
          color === "black"
        ) return "player-turn"
        else if (
          (boardPosition &&
          (boardPosition.color === 1 && color === "white") ||
          (boardPosition.color === -1 && color === "black"))
        ) return "player-turn";
      }
    }
    return false;
  },
  captureCount: function() {
    if (!this.game.wgoGame) return false;
    var color = this.game.getColorOfPosition(this.position);
    if (color === "white") var wgoColor = WGo.W;
    else if (color === "black") var wgoColor = WGo.B;
    if (wgoColor) var theCount = this.game.wgoGame.getCaptureCount(wgoColor);
    if (theCount > 0) return theCount;
  },
  markingDead: function() {
    if (!this.game) return false;
    return this.game.markingDead();
  },
  mdDisabled: function() {
    if (!this.game) return false;
    var game = Games.findOne(this.game._id); // refresh
    return (game.userAcceptedMD === Meteor.userId()) ? "disabled" : "";
  },
  score: function() {
    var game = this.game;
    if (game.archived && game.winnerId && game.score) {
      var color = game.getColorOfPlayerId(game.winnerId);
      var positionColor = game.getColorOfPosition(this.position);
      if (color === positionColor) return game.score;
    }
  }

});

Template.playerBox.events({
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("game/join", this.game._id, color, function(error, result) {
      if (error) return alert(error);
    });
  },
  'click .login-prompt': function(e) {
    e.preventDefault();
    e.stopPropagation();
    $("html, body").animate({ scrollTop: 0 }, 200);
    $("#login-dropdown-list .dropdown-toggle").dropdown('toggle');
  },
  'click #pass-game': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "pass", function(error, result) {
      if (error) return console.log(error.message);
    });
  },
  'click #resign-game': function(e) {
    e.preventDefault();
    var game = this.game;

    $.confirm({
      title: 'Really resign?',
      content: 'Are you sure you want to resign? (This action is irreversible.)',
      confirmButton: "Yes",
      confirmButtonClass: "btn-danger",
      cancelButton: "No",
      theme: "supervan",
      confirm: function(){
        Meteor.call('game/action', game._id, "resign", function(error, result) {
          if (error) return console.log(error.message);
        });
      }
    });
  },
  'click #md-decline': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "declineMD", function(error, result) {
      if (error) return console.log(error.message);
    });
  },
  'click #md-accept': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "acceptMD", function(error, result) {
      if (error) return console.log(error.message);
    });
  },

});
