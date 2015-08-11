// if it's this player's turn
Template.registerHelper('playerTurn', function(){
    // if game is actually playing
    if (this.game.isReady()) {
      var color = this.game.getColorOfPosition(this.position);
      if (
        (this.game.turn === -1 && color === "white") ||
        (this.game.turn === 1 && color === "black")
      ) return "player-turn";
    }
    // if game is completed (and we're viewing history)
    else if (this.game.archived) {
      var currentMove = Session.get("currentMove");

      if (
        currentMove !== undefined &&
        currentMove < this.game.currentMove()
      ) {
        var color = this.game.getColorOfPosition(this.position);

        var boardPosition = this.game.positionAt(currentMove+1);

        if (
          currentMove === 0 &&
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
})

Template.registerHelper('playerData', function(){

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
});
