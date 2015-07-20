// method to combine functions with Games document retrieved from Mongo
Game = function(doc) {
  _.extend(this, doc);
};

// functions to combine
_.extend(Game.prototype, {

  // create a new wgoGame from scratch only if it doesn't exist
  createGame: function(size, repeat) {

    if (["9", "13", "19"].indexOf(size) === -1) {
      console.log("invalid size, using 9");
      size = 9;
    }

    if (!this.wgoGame) {
      var wgoGame = new WGo.Game(size, repeat);
      Games.update({_id: this._id }, { $set: { wgoGame: wgoGame.exportPositions(), messages:[] } });
    }

    return this;
  },

  endGame: function() {
    // var game = Games.findOne(this._id);
    var game = this;

    // if game hasn't had a markdead stage yet, do the markdead stage
    if (!game.markedDead)  {
      markDead(game);
      game.pushMessage("Mark dead stones and 'Accept' to finish the game. 'Decline' to play it out.", GAME_MESSAGE );
    }

    // if we've already marked dead once, end game immediately
    else {
      game.removeMDMarks();

      var score = getFinalScore(game);
      Games.update({_id: game._id}, {$set: {archived: true, endedAt: new Date()} });

      var message = "Game ended. Final score: "+score+".";
      game.pushMessage(message, GAME_MESSAGE);
    }

    return true;
  },

/*
 * MarkDead methods
 */

  // call when someone declines in MarkDead
  declineMD: function() {
    // var game = Games.findOne(this._id);
    var game = this;
    if(!game.markingDead()) return false;

    // remove all marked stones
    game.removeMDMarks();

    // unset markedSchema so game will not be in markDead mode anymore
    Games.update({_id: game._id}, {
      $unset: { markedSchema: "" }
    });

    var message = Meteor.user().username+" declined, so play continues. Game will now end immediately after two passes, so capture all dead stones first.";
    game.pushMessage(message, GAME_MESSAGE);

  },

  // remove "accepted" status of MarkDead
  clearAcceptMD: function() {
    if (this.userAcceptedMD)  {
      Games.update({_id: this._id}, { $unset: { userAcceptedMD: "" } });
    }
  },

  // call when someone clicks "Accept" in MarkDead
  acceptMD: function() {
    // game = Games.findOne(this._id);
    var game = this;
    if(!game.markingDead()) return false;

    // if the other guy has already accepted markDead, end game
    if (game.userAcceptedMD && game.userAcceptedMD != Meteor.userId()) {
      game.endGame();
    } else { // first person to accept markDead gets it set
      Games.update({_id: game._id}, { $set: { userAcceptedMD: Meteor.userId() } });
    }
  },

  // remove all markdead marks from the board
  removeMDMarks: function() {
    // var game = Games.findOne(this._id);
    var game = this;
    Games.update({_id: game._id}, {
      $set: { boardState: game.originalBoardState },
      $unset: { originalBoardState: "", }
    });
  },


/*
 * State checks
 */

  // state: ready to accept moves
  // (has both players, not archived, not marking dead)
  isReady: function() {
    if (
      !this.wgoGame ||
      this.archived ||
      this.markingDead()
    ) return false;
    return (this.blackPlayerId && this.whitePlayerId) ? true : false;
  },

  // state: MarkDead mode
  markingDead: function() {
    // game.markedSchema gets cleared if we leave markedDead mode
    return (this.markedDead && !this.archived && this.markedSchema) ? true : false;
  },

  // state: completed game
  // return (game.archived)

/*
 * Messaging
 */

  pushMessage: function(message, user) {
    var username, styleClass;

    if (user) {
      if (user.gameMessage) {
        username = false;
        styleClass = "game-message";
      }
      else if (user.username) username = user.username;
      else username = false;
    }

    var messageObj = {
      author: username,
      content: message,
      class: styleClass
    }

    if (user) // push to collection
      return Games.update({_id: game._id}, {$push: {messages: messageObj}});
    else // push to local collection (goes away when messages updates)
      return Games._collection.update({_id: game._id}, {$push: {messages: messageObj}})
  },


/*
 * Utility methods
 */

  // check whether user is playing in this game
  hasPlayer: function(user) {
    if (!user) return false;
    if (user._id === this.blackPlayerId || user._id === this.whitePlayerId)
      return true;
    else return false;
  },

  // get color of "top" or "bottom" position in show.js
  getColorOfPosition: function(position) {
    var currentUserColor = this.getColorOfPlayerId(Meteor.userId());
    // if current user is part of this game
    if (currentUserColor) {
      if (position === "bottom") { // bottom: show current user
        return currentUserColor;
      } else if (position === "top") { // top: show opponent
        return getOppositeColor(currentUserColor);
      }
    }
    // if current user not part of this game (or no current user)
    else {
      if (position === "bottom")
        return "black";
      else if (position === "top")
        return "white";
    }
    return false; // default return empty object
  },


  // get color of player in current game
  getColorOfPlayerId: function(playerId) {
    if (!playerId) return false;
    if (this.blackPlayerId === playerId)
      return "black"
    else if (this.whitePlayerId === playerId)
      return "white"
    return false;
  },

  // get user who's playing for given color
  getPlayerAtColor: function(color) {
    if (color === "white") {
      if (this.whitePlayerId) return Meteor.users.findOne( this.whitePlayerId );
    } else if (color === "black") {
      if (this.blackPlayerId) return Meteor.users.findOne( this.blackPlayerId );
    }
    return false;
  },

  // get the color of the current turn
  getColorOfCurrentMove: function() {
    if (!this.wgoGame) return false;
    if (this.archived || !this.isReady()) return false;
    if (this.wgoGame.turn === 1) return "black";
    else if (this.wgoGame.turn === -1) return "white";
  },

  // get the player who has the current turn
  playerToMove: function() {
    var color = this.getColorOfCurrentMove();
    if (color) {
      var player = this.getPlayerAtColor(color);
      if (player) return player;
    }
  },

  // is it the logged-in user's move?
  isCurrentPlayerMove: function() {
    var player = this.playerToMove();
    if (player && Meteor.userId()) return player._id === Meteor.userId();
  },

});
