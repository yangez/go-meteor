// constructor method to combine functions with Games document retrieved from Mongo
Game = function(doc) {
  _.extend(this, doc);
};

// create a new game
Game.create = function(gameAttributes, userId) {
  var user = Meteor.users.findOne(userId)
  if (!user) return false;

  if (["9", "13", "19"].indexOf(gameAttributes.size) === -1) size = 9;

  // new WgoGame (for logic)
  var wgoGame = new WGo.Game(gameAttributes.size);

  var game = _.extend(gameAttributes, {
    createdAt: new Date(),
    lastActivityAt: new Date(),
    passCount: 0,
    wgoGame: wgoGame.exportPositions(),
  });

  // have person join game as color they picked
  if (gameAttributes.color === "white")
    game = _.extend( game, { whitePlayerId: user._id } );
  else if (gameAttributes.color === "black")
    game = _.extend( game, { blackPlayerId: user._id } );
  game = _.omit( game, "color" );

  // add timeUsed parameter if this is a timed game
  if (gameAttributes.gameLength != undefined)
    game = _.extend( game, { timeUsed: { white: 0, black: 0 } } );

  if (gameAttributes.byoyomi)
    game = _.extend( game, { byoLeft: { white: game.byoyomi.periods, black: game.byoyomi.periods } });

  // returns ID
  var gameId = Games.insert(game);

  // add new Room for this game's messages
  var roomId = createRoom({
    name: gameId,
    type: "game"
  })
  Games.update({_id: gameId}, {$set: {roomId: roomId}});

  return gameId;

};

// Game functions
_.extend(Game.prototype, {

  // have user join game as color
  joinGame: function(userId, color) {
    var user = Meteor.users.findOne(userId);

    if (this.hasPlayerId(user._id)) return false;

    if (color === "black") {
      Games.update({_id: this._id}, {$set: { blackPlayerId: user._id} } )
    } else if (color === "white") {
      Games.update({_id: this._id}, {$set: { whitePlayerId: user._id} })
    }

    // refresh Game for next check
    var game = Games.findOne(this._id);

    // push game started message if it's not already there
    if (game.isReady()) {
      game.pushMessage("Game has started, "+game.playerToMove().username+" begins. Enjoy!", "system");
    }

  },

  // goes to MD mode if we haven't yet, ends game if we have
  endGame: function() {
    var game = this;

    // if game hasn't had a markdead stage yet, do the markdead stage
    if (!game.markedDead)  {
      game.markDead();
      game.pushMessage("Mark dead stones and 'Accept' to finish the game. 'Decline' to play it out.", 'system');
    }

    // if we've already marked dead once, end game immediately
    else {
      game.removeMDMarks();

      var score = this.getFinalScore();
      var winner = this.getWinner();

      var message = "Game ended. Final score: "+score+". Congratulations "+winner.username+"!";
      game.pushMessage(message, 'system');

      Games.update({_id: game._id}, {$set: {
        archived: "finished",
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
    if (this.absTimeLeft(color) === 0 ) {

      var loser = user;
      var winnerId = this.getOtherPlayerId(user._id);
      var winner = Meteor.users.findOne(winnerId);

      var score = (color === "white") ? "B+" : "W+"

      var message = "Game ended, "+loser.username+" ran out of time. Congratulations "+winner.username+"!";
      this.pushMessage(message, 'system');

      var set = {
        archived: "timedout",
        endedAt: new Date(),
        score: score,
        winnerId: winner._id,
        loserId: loser._id
      };

      this.updateTimer(set, color);

      Games.update({_id: this._id}, {$set: set});

    }

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
  updateMDMarkers: function(gameBoard) {
    if (!gameBoard || !gameBoard.board) return false;
    var board = gameBoard.board;
    board.removeObjectsOfType("DEAD");
    if (this.deadMarkers && this.deadMarkers.length > 0) {
      board.addObject(this.deadMarkers);
    }
  },

  updateTurnMarker: function(gameBoard) {
    if (!gameBoard || !gameBoard.board) return false;
    var board = gameBoard.board;
    board.removeObjectsOfType("CR");
    if (this.turnMarker && this.turnMarker.type && this.turnMarker.x != "pass") {
      board.addObject(this.turnMarker) ;
    }
  },

  // clear all hovering stones (for use at end of game)
  clearHover: function(gameBoard) {
    if (!gameBoard || !gameBoard.board) return false;
    var board = gameBoard.board;
    if (!this.isReady()) {
      board.removeObjectsOfType("BLACK_HOVER");
      board.removeObjectsOfType("WHITE_HOVER");
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

  // notify player that it's their turn
  notifyPlayerId: function(userId) {
    var user = Meteor.users.findOne(userId);
    user.sendNotification(this._id, "yourTurn");
  },

  // insert user in opponent slot (no matter which color current player is)
  joinOpponentId: function(oppId) {
    if (
      this.isReady() ||
      this.archived ||
      (!this.blackPlayerId && !this.whitePlayerId)
    ) return false;

    if (!Meteor.users.findOne(oppId)) return false;

    var color = (this.blackPlayerId) ? "white" : "black";
    return this.joinGame(oppId, color);

  },


  /*
   * Player actions
   */

  // play a move. if x == "pass", it will play a pass instead
  playMove: function(x, y) {
    var game = this;
    var wgoGame = game.wgoGame;
    var passed = false;

    // if game isn't created, return
    if (game.archived) return console.log("The game has ended.");
    if (!game.isReady()) return console.log("You need an opponent first.");
    if (!game.isCurrentPlayerMove()) return console.log("It's your opponent's turn.");

    // remove all challenges related to this game
    game.acknowledgeChallenges();

    // notify opponent that it's their turn
    var otherPlayerId = this.getOtherPlayerId(Meteor.userId());
    var otherPlayer = Meteor.users.findOne(otherPlayerId);
    game.notifyPlayerId(otherPlayerId);

    var formerPosition = wgoGame.getPosition();

    if (x==="pass") { // if we're playing a pass
      wgoGame.pass();
      game.pushMessage(Meteor.user().username+" has passed.", 'system')

      var turnMarker = { }
      passed = true;

    } else { // if we're playing a real move

      var captured = wgoGame.play(x,y);

      if (typeof captured !== "object") {
        if (captured === 1) return false;
        var msg = "An unknown error occurred.";
        if (captured === 2) msg = "There's already a stone here.";
        if (captured === 3) msg = "That move would be suicide.";
        if (captured === 4) msg = "That move would repeat a previous position.";
        if (Meteor.isClient) showMessage(msg);
        return false;
      }

      // reverse turn color (because we already played it)
      var turn = (wgoGame.turn === WGo.B) ? WGo.W : WGo.B;

      // create last move marker to add to game
      var turnMarker = { x: x, y: y, type: "CR" }
    }

    var set = {
      wgoGame: wgoGame.exportPositions(),
      turnMarker: turnMarker,
      lastActivityAt: new Date(),
      undoRequested: false,
      previousPosition: formerPosition,
    };

    if (!passed) {
      set["passCount"] = 0;
    }

    // if this game is timed, do timer operations
    var color = getOppositeColor( this.getColorOfCurrentMove() );
    this.updateTimer(set, color);

    Games.update({_id: game._id}, { $set: set });

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

  // someone resigns
  resign: function() {
    var loser = Meteor.user();
    var loserColor = this.getColorOfPlayerId(loser._id);

    if (!loserColor) return false;

    var score = (loserColor === "white") ? "B+" : "W+"

    var winnerColor = getOppositeColor(loserColor);
    var winner = this.getPlayerAtColor(winnerColor);

    var message = loser.username + " resigned. Congratulations "+winner.username+"!";
    this.pushMessage(message, 'system');

    var set = {
      archived: "resigned",
      endedAt: new Date(),
      score: score,
      winnerId: winner._id,
      loserId: loser._id
    };

    this.updateTimer(set, loserColor);

    Games.update({_id: this._id}, {$set: set});

  },

  // call when someone cancels
  cancel: function() {
    if (this.isPlaying())
      throw new Meteor.Error("Game is already playing.");

    var user = Meteor.user();
    if (!this.hasPlayerId(user._id))
      throw new Meteor.Error("User isn't part of this game.")

    var message = user.username + " canceled the game.";
    this.pushMessage(message, 'system');

    var set = {
      archived: "canceled",
      endedAt: new Date(),
    }

    Games.update({_id: this._id}, {$set: set});
  },

  // Called when someone wants to rematch
  rematch: function() {
    if (!this.hasPlayerId(Meteor.userId()))
      throw new Meteor.Error("User isn't part of the game.");

    var rematchExists = Challenges.findOne({ $and: [
      { "gameAttributes.rematchOf": this._id },
      { declined: false },
      { canceled: false }
    ] });

    if (rematchExists)
      throw new Meteor.Error("Rematch challenge already exists.");

    var currentColor = this.getColorOfPlayerId(Meteor.userId());

    var opponentId = this.getOpponentId();
    var opponent = Meteor.users.findOne(opponentId);

    var gameAttributes = {
      color: getOppositeColor(currentColor),
      gameLength: this.gameLength,
      size: this.size,
      byoyomi: this.byoyomi,
      rematchOf: this._id
    }

    var challengeId = createChallenge(gameAttributes, opponent._id);

    return challengeId;
  },

  // call when someone plays a pass
  pass: function() {
    if (!this.isCurrentPlayerMove()) return false;
    this.playMove("pass");

    var currentPassCount = this.passCount + 1;

    if (currentPassCount >= 2) {
      game = Games.findOne(this._id);
      game.endGame();
    } else {
      set = {
        passCount: currentPassCount
      }
      Games.update({_id: this._id}, {$set: set});

      return;
    }
  },

  // call when someone tries to undo
  requestUndo: function() {
    if (!this.isPlaying())
      throw new Meteor.Error("You can't undo when the game isn't active.")

    if (this.isCurrentPlayerMove())
      throw new Meteor.Error("You can't undo on your turn.")

    var set = { undoRequested: Meteor.userId() }

    return Games.update({_id: this._id}, {$set: set});
  },

  denyUndo: function() {
    if (!this.undoRequested || !this.isCurrentPlayerMove())
      throw new Meteor.Error("You can't deny an undo right now.");

    var unset = { undoRequested: "" };

    return Games.update({_id: this._id}, {$unset: unset});
  },

  // call when someone accepts your undo
  acceptUndo: function() {
    if (!this.undoRequested || !this.isCurrentPlayerMove())
      throw new Meteor.Error("You can't accept an undo right now.");

    var setColor = (this.wgoGame.turn === 1) ? -1 : 1;

    var set = {
      "wgoGame.turn": setColor,
      previousPosition: this.wgoGame.getPosition(),
    }
    var unset = {
      undoRequested: "",
      turnMarker: "" ,
    };
    var pop = { "wgoGame.stack": 1 };

    // if this game is timed, do timer operations
    var color = this.getColorOfCurrentMove();
    this.updateTimer(set, color);

    return Games.update({_id: this._id}, {
      $set: set,
      $unset: unset,
      $pop: pop,
    });
  },

  // call when someone declines in MarkDead
  declineMD: function() {
    var game = this;
    if(!game.markingDead()) return false;

    // remove all marked stones
    this.removeMDMarks();

    // unset markedSchema so game will not be in markDead mode anymore
    var data = {
      $unset: { markedSchema: "", userAcceptedMD: "" }
    }

    var now = (Meteor.isClient) ? new Date(TimeSync.serverTime()) : new Date();
    var set = {
      passCount: 0,
      lastMoveAt: now
    }

    data = _.extend(data, {$set: set})

    Games.update({_id: game._id}, data);

    var message = Meteor.user().username+" declined, so play continues. Game will now end immediately after two passes, so capture all dead stones first.";
    game.pushMessage(message, 'system');

  },

  // call when someone clicks "Accept" in MarkDead
  acceptMD: function() {
    var game = this;
    if(!game.markingDead()) return false;

    // if the other guy has already accepted markDead, end game
    if (game.userAcceptedMD && game.userAcceptedMD != Meteor.userId()) {
      game.endGame();
    } else { // first person to accept markDead gets it set
      Games.update({_id: game._id}, { $set: { userAcceptedMD: Meteor.userId() } });
    }
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

  // check both sides' timers and end game if it's flagged
  checkTimerFlag: function() {
    var game = this;
    if (!game.isTimed() || !game.isReady() || game.archived) return false;

    var whitetimeLeft = game.totalTimeLeft("white");
    var blacktimeLeft = game.totalTimeLeft("black");

    if (whitetimeLeft === 0)
      Meteor.call("game/endOnTime", game._id, "white");
    else if (blacktimeLeft === 0)
      Meteor.call("game/endOnTime", game._id, "black");

    return true;
  },

  // total time bank
  totalTime: function() {
    if (this.isTimed() === "byoyomi")
      return this.byoyomi.periods * this.byoyomi.time + this.gameLength;
    else if (this.isTimed() === "absolute")
      return this.gameLength;
    else return false;
  },

  // total time left for a color in milliseconds
  totalTimeLeft: function(color) {
    if (!this.isTimed()) return false;

    var absTimeBank = this.gameLength ? this.gameLength - this.timeUsed[color] : 0;
    if (absTimeBank < 0) absTimeBank = 0;

    var byoTimeBank = (this.isTimed() === "byoyomi") ?
      this.byoLeft[color] * this.byoyomi.time : 0;

    // if other person's turn, or MD
    if (this.getColorOfCurrentMove() !== color || this.markingDead())
      return absTimeBank + byoTimeBank;

    // if first move in the game
    else if (!this.timerIsRunning())
      return this.gameLength + byoTimeBank;

    // this person's turn and timer is running
    else {
      var timeLeft = absTimeBank + byoTimeBank - this.timeSinceLastMove();
      return (timeLeft > 0) ? timeLeft : 0;
    }

  },

  // returns the absolute time remaining for a color in milliseconds
  absTimeLeft: function(color) {
    if (!this.isTimed()) return false;
    var timeLeft = this.totalTimeLeft(color) - this.byoTotalTime();
    return (timeLeft > 0) ? timeLeft : 0;
  },

  // returns byoyomi time remaining for a color in milliseconds
  byoTimeLeft: function(color) {
    if (this.isTimed() !== "byoyomi") return false;
    var timeLeft = this.totalTimeLeft(color) - this.absTimeLeft(color);
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

    var timeLeft = this.byoTimeLeft(color);
    var byoTimeUsed = this.byoTotalTime() - timeLeft;
    var periodsUsed = parseInt( byoTimeUsed / this.byoyomi.time )
    var periods = this.byoyomi.periods - periodsUsed;

    var displayTimeLeft = (timeLeft > 0) ?
      timeLeft - (periods-1)*this.byoyomi.time : 0

    return {
      periods: periods,
      time: timeDisplay(displayTimeLeft)
    };
  },

  // update timer
  updateTimer: function(set, color) {

    var now = (Meteor.isClient && TimeSync) ? new Date(TimeSync.serverTime()) : new Date;
    set = _.extend(set, { lastMoveAt: now });

    if (this.isTimed() && ["black", "white"].indexOf(color) > -1) {

      var absTimeLeft = this.absTimeLeft(color);
      var timeSinceLastMove = this.timeSinceLastMove();

      // if absolute time bank can take all the time
      if (absTimeLeft > timeSinceLastMove) {
        set['timeUsed.'+color] = this.timeUsed[color] + timeSinceLastMove;
      }
      // if absolute time bank can't take all the time
      else {
        // set timeUsed to the whole amount
        set['timeUsed.'+color] = this.gameLength;

        // find the time byoyomi used
        var byoTimeUsed = timeSinceLastMove - absTimeLeft;
        if (byoTimeUsed > 0 && this.isTimed() === "byoyomi") {
          var periodsUsed = parseInt( byoTimeUsed / this.byoyomi.time );
          set['byoLeft.'+color] = this.byoLeft[color] - periodsUsed;
        }
      }

    }

    return true;
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

  // state: first move has been made & game is currently playing
  isPlaying: function() {
    if ( !this.isReady ) return false;
    return (this.wgoGame.stack.length > 1);
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

  pushMessage: function(content, type) {
    if (type !== "system") var type = undefined;
    var currentMove;

    if (this.getCurrentMoveNumber()) currentMove = this.getCurrentMoveNumber()-1;

    var meta = {
      type: type,
      currentMove: currentMove,
    }

    var room = Rooms.findOne(this.roomId);
    if (room) return room.addMessage(content, meta);
  },

  // get all messages before a certain movenumber
  getMessagesBeforeMove: function(moveNumber) {

    if (this.roomId) return Messages.find({ $and: [
      { roomId: this.roomId },
      { "meta.currentMove": { $lt: moveNumber } }
    ] });

    else return _.filter(this.messages, function(m) { return m.currentMove != undefined && m.currentMove < moveNumber; });

  },

  // get all messages
  getMessages: function() {
    if (this.roomId) return Messages.find({roomId: this.roomId});
    else if (this.messages) return this.messages;
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
  hasPlayerId: function(userId) {
    if (userId === this.blackPlayerId || userId === this.whitePlayerId)
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
  getOtherPlayerId: function(userId) {
    var thisColor = this.getColorOfPlayerId(userId);
    var thatColor = getOppositeColor(thisColor);
    if (thisColor && thatColor) {
      var other = this.getPlayerAtColor(thatColor);
      return other._id;
    }
  },

  // get opponent
  getOpponentId: function() {
    return this.getOtherPlayerId(Meteor.userId());
  },

  // check whether user is physically here in this game
  userIdPresent: function(userId) {
    var presence = Presences.findOne({ $and: [
      { userId: userId },
      { "state.currentRoute": "match" },
      { "state.currentGameId": this._id },
    ] })
    return presence ? true : false;
  },

  // acknowledge all challenges related to this
  acknowledgeChallenges: function() {
    var challenge = Challenges.findOne({ gameId: this._id });
    if (challenge) return challenge.acknowledge();
  },

});
