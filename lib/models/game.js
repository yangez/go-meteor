// constructor method to combine functions with Games document retrieved from Mongo
Game = function(doc) {
  _.extend(this, doc);
};

// Game functions
_.extend(Game.prototype, {

  endGame: function() {
    var game = this;

    // if game hasn't had a markdead stage yet, do the markdead stage
    if (!game.markedDead)  {
      game.markDead();
      game.pushMessage("Mark dead stones and 'Accept' to finish the game. 'Decline' to play it out.", GAME_MESSAGE );
    }

    // if we've already marked dead once, end game immediately
    else {
      game.removeMDMarks();

      var score = this.getFinalScore();
      var winner = this.getWinner();

      var message = "Game ended. Final score: "+score+". Congratulations "+winner.username+"!";
      game.pushMessage(message, GAME_MESSAGE);

      Games.update({_id: game._id}, {$set: {
        archived: true,
        endedAt: new Date(),
        score: score,
        winnerId: winner._id,
        loserId: this.getLoser()._id
      } });
    }
    return true;
  },

  // end game because someone ran out of time
  endGameOnTime: function(color) {
    var user = this.getPlayerAtColor(color);

    if (!user || !this.timerIsRunning()) return false;

    // if this current guy actually did run out of time
    if (this.absTimeRemaining(color) === 0 ) {
      var loser = user;
      var winner = this.getOtherPlayer(user);

      var score = (color === "white") ? "B+" : "W+"

      var message = "Game ended, "+loser.username+" ran out of time. Congratulations "+winner.username+"!";
      this.pushMessage(message, GAME_MESSAGE);

      var set = {
        archived: true,
        endedAt: new Date(),
        score: score,
        winnerId: winner._id,
        loserId: loser._id
      };
      set['timeUsed.'+color] = this.gameLength;

      Games.update({_id: this._id}, {$set: set});

    }

  },

  resign: function() {
    var loser = Meteor.user();
    var loserColor = this.getColorOfPlayerId(loser._id);

    if (!loserColor) return false;

    var score = (loserColor === "white") ? "B+" : "W+"

    var winnerColor = getOppositeColor(loserColor);
    var winner = this.getPlayerAtColor(winnerColor);

    var message = loser.username + " resigned. Congratulations "+winner.username+"!";
    this.pushMessage(message, GAME_MESSAGE);

    Games.update({_id: this._id}, {$set: {
      archived: true,
      endedAt: new Date(),
      score: score,
      winnerId: winner._id,
      loserId: loser._id
    } });

  },

  // Get the final formatted score for the game
  getFinalScore: function() {
    // if game has a marked schema (MD was accepted), return the marked score
    if (this.markedSchema) {
      var markedPosition = new WGo.Position;
      _.assign(markedPosition, this.wgoGame.getPosition());
      markedPosition.schema = this.markedSchema;
      return markedPosition.formattedScore();
    } else { // if game doesn't have marked schema (MD was declined), return top position's score
      return this.wgoGame.getPosition().formattedScore();
    }
  },

  // remove "accepted" status of MarkDead
  clearAcceptMD: function() {
    if (this.userAcceptedMD)  {
      Games.update({_id: this._id}, { $unset: { userAcceptedMD: "" } });
    }
  },


  // remove all markdead marks from the board
  removeMDMarks: function() {
    var game = this;
    Games.update({_id: game._id}, {
      $unset: { deadMarkers: "", }
    });
  },

  // Remove all md markers, then add md markers to board
  updateMDMarkers: function(board) {
    board.removeObjectsOfType("DEAD");
    if (this.deadMarkers && this.deadMarkers.length > 0) {
      board.addObject(this.deadMarkers);
    }
  },

  updateTurnMarker: function(board) {
    board.removeObjectsOfType("CR");
    if (this.turnMarker && this.turnMarker.type && this.turnMarker.x != "pass") {
      board.addObject(this.turnMarker) ;
    }
  },

  // go into MarkDead mode
  markDead: function() {
    var game = Games.findOne(this._id);

    // duplicate our schema so we can mark stones as dead
    markedSchema = _.clone(game.wgoGame.getPosition().schema);

    // set game to markDead mode, set markedSchema to markedSchema
    Games.update({_id: game._id}, {$set: {
      markedDead: true,
      markedSchema: markedSchema,
    } });

    return true;
  },

  // notify current player that it's their turn
  notifyCurrentPlayer: function() {
    if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
      if (this.isCurrentPlayerMove()) {
        var opponent = this.getOpponent();
        var color = this.getColorOfPlayerId(Meteor.userId());

        notify.createNotification("Your move", {
          body: "It's your turn to move in your "+this.size+"x"+this.size+" game as "+color+" against "+opponent.username+".",
          icon: "/chat.ico"
        });

      }
    }
  },


  /*
   * Player actions
   */

  // play a move. if x == "pass", it will play a pass instead
  playMove: function(x, y) {
    var game = this;
    var wgoGame = game.wgoGame;

    // if game isn't created, return
    if (game.archived) return game.pushMessage("The game has ended.");
    if (!game.isReady()) return game.pushMessage("You need an opponent first.");
    if (!game.isCurrentPlayerMove()) return game.pushMessage("It's your opponent's turn.");

    if (x==="pass") { // if we're playing a pass
      wgoGame.pass();
      game.pushMessage(Meteor.user().username+" has passed.", GAME_MESSAGE)

      var turnMarker = { }

    } else { // if we're playing a real move

      var captured = wgoGame.play(x,y);

      if (typeof captured !== "object") {
        if (captured === 1) return false;
        var msg = "An unknown error occurred.";
        if (captured === 2) msg = "There's already a stone here.";
        if (captured === 3) msg = "That move would be suicide.";
        if (captured === 4) msg = "That move would repeat a previous position.";
        return game.pushMessage(msg);
      }

      // reverse turn color (because we already played it)
      var turn = (wgoGame.turn === WGo.B) ? WGo.W : WGo.B;

      // create last move marker to add to game
      var turnMarker = { x: x, y: y, type: "CR" }
    }

    var set = {
      wgoGame: wgoGame.exportPositions(),
      turnMarker: turnMarker,
      lastActivityAt: new Date()
    }
    var dec = {};

    // if this game is timed, do basic timer operations
    if (this.isTimed()) {
      // we've already played move, so get the opposite color of turn
      var color = getOppositeColor( this.getColorOfCurrentMove() );
      var now = (Meteor.isClient) ? new Date(TimeSync.serverTime()) : new Date;
      set = _.extend(set, { lastMoveAt: now });

      // absolute timeUsed
      set['timeUsed.'+color] = this.timeUsed[color] + this.timeSinceLastMove();

      if (this.isTimed() === "byoyomi") {
        var periodsUsed = parseInt( this.timeSinceLastMove() / this.byoyomi.time );
        dec['byoLeft'+color] = -periodsUsed;
      }
    }

    Games.update({_id: game._id}, { $set: set }, { $dec: dec });

    return game;
  },

  // called when player clicks stone in MarkDead mode
  togglePointAsDead: function(x, y) {
    var game = this;
    if (!game.markedSchema) return false;

    var marked = game.markedSchema;
        original = game.wgoGame.getPosition().schema,
        changed = false;

    var index = convertCoordinatesToSchemaIndex(original, x, y);
    if (index) { // if point exists

      // unaccept markDead on behalf of all players
      game.clearAcceptMD();

      var marker = { x: x, y: y, type: "DEAD" }

      /* if point is the same as the original && point is set to either white or black
          set point to neutral in marked */
      if (
        marked[index] === original[index] &&
        [-1, 1].indexOf(marked[index]) > -1
      ) {
        marked[index] = 0; changed = true;
        Games.update({_id: game._id}, {$push: {deadMarkers: marker}});
      }

      /* else if point is different than the original
      set point to the original in marked */
      else if (marked[index] != original[index]) {
        marked[index] = original[index]; changed = true;
        Games.update({_id: game._id}, {$pull: {deadMarkers: marker}});
      }

      // write to DB if something changed
      if (changed) {
        Games.update({_id: game._id}, {$set: {markedSchema: marked }});
      }
    }
  },


  // call when someone declines in MarkDead
  declineMD: function() {
    // var game = Games.findOne(this._id);
    var game = this;
    if(!game.markingDead()) return false;

    // remove all marked stones
    this.removeMDMarks();

    // unset markedSchema so game will not be in markDead mode anymore
    var data = {
      $unset: { markedSchema: "", userAcceptedMD: "" }
    }

    // if this has a timer, update the last move timer to current time
    if (this.isTimed()){
      var now = (Meteor.isClient) ? new Date(TimeSync.serverTime()) : new Date;
      data = _.extend(data, { $set: { lastMoveAt: now } });
    }

    Games.update({_id: game._id}, data);


    var message = Meteor.user().username+" declined, so play continues. Game will now end immediately after two passes, so capture all dead stones first.";
    game.pushMessage(message, GAME_MESSAGE);

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

  // call when someone plays a pass
  playPass: function() {
    if (!this.isCurrentPlayerMove()) return false;
    this.playMove("pass");

    // end game if two passes were played consecutively
    var game = Games.findOne(this._id);
    var lastThreePositions = _.last(game.wgoGame.stack, 3);
    if (lastThreePositions.length != 3) return;
    if (
      _.isEqual(lastThreePositions[0].schema, lastThreePositions[1].schema) &&
      _.isEqual(lastThreePositions[0].schema, lastThreePositions[2].schema)
    ) game.endGame();
  },


/*
 * Timer functions
 */

  // returns whether this game is timed, and how
  isTimed: function() {
    if (this.byoyomi) return "byoyomi";
    else if (this.gameLength && this.timeUsed) return "absolute";
    else return false;
  },

  // checks that the game's timer is currently running
  timerIsRunning: function() {
    return this.isTimed() && this.lastMoveAt && !this.archived ? true : false;
  },


  /* New stuff */

  // total time bank
  totalTime: function() {
    if (this.isTimed() === "byoyomi")
      return this.byoyomi.periods * this.byoyomi.time + this.gameLength;
    else if (this.isTimed() === "absolute")
      return this.gameLength;
    else return false;
  },

  // total time left
  totalTimeLeft: function(color) {
    if (!this.isTimed()) return false;
    return this.totalTime() - this.timeSinceLastMove();
  },

  // returns the absolute time remaining for a color in milliseconds
  absTimeLeft: function(color) {
    if (!this.isTimed()) return false;
    var timeLeft = this.totalTimeLeft(color) - this.byoTotalTime()
    return (timeLeft > 0) ? timeLeft : 0;
  },

  // returns byoyomi time remaining for a color in milliseconds
  byoTimeLeft: function(color) {
    if (this.isTimed() !== "byoyomi") return false;
    var timeLeft = this.totalTimeLeft() - this.absTimeLeft(color);
    return (timeLeft > 0) ? timeLeft : 0;
  },

  // total byoyomi time
  byoTotalTime: function() {
    if (this.isTimed() !== "byoyomi") return false;
    return this.byoyomi.periods * this.byoyomi.time;
  },

  // return duration since the last activity (in ms)
  timeSinceLastMove: function() {
    if (!this.isTimed()) return false;
    var now = (Meteor.isClient && TimeSync.serverTime()) ? new Date(TimeSync.serverTime()) : new Date;
    return moment(now) - moment(this.lastMoveAt);
  },

  byoFormatTimeLeft: function(color) {
    if (this.isTimed() !== "byoyomi") return false;

    var timeRemaining = this.byoTimeLeft(color);

    var periods = this.byoLeft[color] - parseInt( (this.byoTotalTime() - timeRemaining) / this.byoyomi.time );

    var displayTimeRemaining = (timeRemaining > 0) ?
      timeRemaining - (periods-1)*this.byoyomi.time : 0

    return {
      periods: periods,
      time: timeDisplay(displayTimeRemaining)
    };
  },






  /* Old stuff */

  // check both sides' timers and end game if it's flagged
  checkTimerFlag: function() {
    var game = this;
    if (!game.isTimed() || !game.isReady()) return false;

    var whiteTimeRemaining = game.totalTimeRemaining("white");
    var blackTimeRemaining = game.totalTimeRemaining("black");

    if (whiteTimeRemaining === 0)
      Meteor.call("game/endOnTime", game._id, "white");
    else if (blackTimeRemaining === 0)
      Meteor.call("game/endOnTime", game._id, "black");

    return true;
  },


  // returns byoyomi time remaining (the whole chunk in milliseconds)
  byoTimeRemaining: function(color) {
    if (this.isTimed() !== "byoyomi") return false;

    // if it's other player's turn or we're in MD
    if (this.getColorOfCurrentMove() !== color || this.markingDead())
      return this.byoLeft[color] * this.byoyomi.time;

    // if timer or byo timer is not running
    else if (!this.timerIsRunning() || !this.byoIsRunning(color))
      return this.byoTotalTime();

    // if it's this person's turn and timer is running
    else {
      var timeBank = this.byoLeft[color] * this.byoyomi.time;

      var remaining = timeBank + this.absTimeRemaining(color);
      return (remaining < 0) ? 0 : remaining;
    }
  },



  byoIsRunning: function(color) {
    if (this.isTimed() !== "byoyomi") return false;
    return this.absTimeRemaining(color) < 0;
  },

  // returns the absolute time remaining for a color in milliseconds
  absTimeRemaining: function(color) {
    if (!this.isTimed()) return false;

    // if it's other person's turn, or if we're markingDead
    if (this.getColorOfCurrentMove() !== color || this.markingDead())
      return this.gameLength - this.timeUsed[color];

    // if it's the first move in the game
    else if (!this.timerIsRunning())
      return this.gameLength;

    // if it's this person's turn and timer is running
    else {
      var remaining = this.gameLength - this.timeUsed[color] - this.timeSinceLastMove();
      return remaining; // negative values here indicate byoyomi
    }
  },


/*
 * State checks
 */

  // state: ready to accept moves
  // (has both players, not archived, not marking dead)
  isReady: function() {
    if (
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
    var username, currentMoveNumber, styleClass;

    if (user) {
      // if it's a game message (bold)
      if (user.gameMessage) {
        username = false;
        styleClass = "game-message";

      }
      // if it's a user message
      else if (user.username) {
        username = user.username;
      }
      // if it's a utility message (non-persistent)
      else username = false;
    }

    if (this.getCurrentMoveNumber()) var currentMove = this.getCurrentMoveNumber()-1;

    var messageObj = {
      author: username,
      content: message,
      class: styleClass,
      currentMove: currentMove
    }

    if (user) // push to collection
      return Games.update({_id: this._id}, {$push: {messages: messageObj}});
    else if (Meteor.isClient) // show error if it's on the client
      return showMessage(messageObj.content);
  },

  getMessagesBeforeMove: function(moveNumber) {

    var messages = _.filter(this.messages, function(m) { return m.currentMove != undefined && m.currentMove < moveNumber; });

    return messages;

  },

/*
 * Utility methods
 */

  // get winner of the game using current score
  getWinner: function() {
    var score = this.getFinalScore();
    var winColor = (score.charAt(0) === "W") ? "white" : "black";
    return this.getPlayerAtColor(winColor);
  },

  // get loser of the game using current score
  getLoser: function() {
    var score = this.getFinalScore();
    var loseColor = (score.charAt(0) === "W") ? "black" : "white";
    return this.getPlayerAtColor(loseColor);
  },

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

  // get the current move #
  getCurrentMoveNumber: function() {
    if (this.isReady() || this.markingDead()) return this.wgoGame.stack.length;
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

  // get the other player
  getOtherPlayer: function(user) {
    var thisColor = this.getColorOfPlayerId(user._id);
    var thatColor = getOppositeColor(thisColor);
    if (thisColor && thatColor) {
      var other = this.getPlayerAtColor(thatColor);
      return other;
    }
  },

  // get opponent
  getOpponent: function() {
    return this.getOtherPlayer(Meteor.user());
  }

});
