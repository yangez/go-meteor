var scrollMessages = function(speed) {
  if ($(".messages").length > 0) {
    $(".messages").animate({scrollTop:$(".messages")[0].scrollHeight}, speed);
  }
}

Template.gamePage.onRendered(function(){
  scrollMessages(0);
});

Template.gamePage.helpers({
  messages: function(){
    return this.messages;
  },
  messageScroller: function() {
    if (this.messages) scrollMessages();
  },
  toMove: function() {
    if (!this.wgoGame || !isReady(this)) return "Waiting for opponent";
    if (hasPlayer(this, Meteor.userId())) {
      if (isPlayerTurn(this, Meteor.userId())) {
        return "Your move";
      } else {
        return "Opponent's move"
      }
    } else {
      if (this.wgoGame.turn === WGo.B) var color = "Black";
      else var color = "White";
      return color + " to move";
    }
  }
});

Template.gamePage.events({
  'click .messages-container': function(e) {
    $("#comment-form input[type=text]").focus();
  },
  'submit #comment-form': function(e) {
    e.preventDefault();

    if (!Meteor.userId()) return false;

    var content = $(e.target).find('[name=content]').val();
    if (!content) return false;

    pushMessage(this, content, Meteor.user());

    $(e.target).find('[name=content]').val("");
  },
});


Template.playerBox.helpers({
  data: function() {
    var currentUserColor = getColorOfPlayerId(this.game, Meteor.userId());

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
        opponent = getPlayerAtColor(this.game, opponentColor);

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
        var blackPlayer = getPlayerAtColor(this.game, "black");

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
        var whitePlayer = getPlayerAtColor(this.game, "white");

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
    if (!isReady(this.game)) return false;
    var color = getColorOfPosition(this.game, this.position);
    if (
      (this.game.wgoGame.turn === -1 && color === "white") ||
      (this.game.wgoGame.turn === 1 && color === "black")
    ) return "player-turn";
    else return false;
  },
  captureCount: function() {
    if (!isReady(this.game)) return false;
    var color = getColorOfPosition(this.game, this.position);
    if (color === "white") var wgoColor = WGo.W;
    else if (color === "black") var wgoColor = WGo.B;
    if (wgoColor) return this.game.wgoGame.getCaptureCount(wgoColor);
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
  'click #archive-game': function(e) {
    e.preventDefault();
    endGame(this.game);
  },
  'click #pass-game': function(e) {
    e.preventDefault();
    playPass(this.game);
  }
});


// board js
