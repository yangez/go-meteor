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
  playerTurn: function() {
    if (!this.game.isReady()) return false;
    var color = this.game.getColorOfPosition(this.position);
    if (
      (this.game.wgoGame.turn === -1 && color === "white") ||
      (this.game.wgoGame.turn === 1 && color === "black")
    ) return "player-turn";
    else return false;
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
  }

});

Template.playerBox.events({
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("joinGame", this.game, color, Meteor.userId(), function(error, result) {
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
    this.game.playPass();
  },
  'click #md-decline': function(e) {
    e.preventDefault();
    this.game.declineMD();
  },
  'click #md-accept': function(e) {
    e.preventDefault();
    this.game.acceptMD();
  }
});
