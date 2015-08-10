Games = new Mongo.Collection('games');

Games.create = function(gameAttributes, userId) {

  var user = Meteor.users.findOne(userId)
  if (!user) return false;

  if (["9", "13", "19"].indexOf(gameAttributes.size) === -1) size = 19;

  // extend game object
  var game = _.extend(gameAttributes, {
    createdAt: new Date(),
    lastActivityAt: new Date(),
    passCount: 0,
    repeating: "KO",
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

  // create base Position (with nothing on it)
  var position = Positions.create(gameId, {
    capCount: { black: 0, white: 0 },
    turn: WGo.B
  });

  // add new Room for this game's messages
  var roomId = createRoom({
    name: gameId,
    type: "game"
  })
  Games.update({_id: gameId}, {$set: {roomId: roomId}});

  return gameId;

};

Games.helpers({

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
      _.assign(markedPosition, this.position());
      markedPosition.schema = this.markedSchema;
      return markedPosition.formattedScore();
    } else { // if game doesn't have marked schema (MD was declined), return top position's score
      return this.position().formattedScore();
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
    markedSchema = _.clone(game.position().schema);

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
    user.sendNotification("yourTurn", {gameId: this._id});
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

    var formerPosition = this.position();

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

    // notify opponent that it's their turn
    var otherPlayerId = this.getOtherPlayerId(Meteor.userId());
    var otherPlayer = Meteor.users.findOne(otherPlayerId);
    game.notifyPlayerId(otherPlayerId);

    return game;
  },

  // called when player clicks stone in MarkDead mode
  togglePointAsDead: function(x, y) {
    var game = this;
    if (!game.markedSchema) return false;

    var marked = game.markedSchema;
        original = game.position().schema,
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
    var user = Meteor.user();
    if (!this.hasPlayerId(user._id))
      throw new Meteor.Error("User isn't part of the game.");

    // find existing rematch
    var rematchExists = Herald.collection.findOne({ $and: [
      { "courier": 'challengeNew' },
      { "data.gameData.rematchOf": this._id },
    ] });

    if (rematchExists)
      throw new Meteor.Error("Rematch challenge already exists.");

    var currentColor = this.getColorOfPlayerId(user._id);

    var opponentId = this.getOpponentId();
    var opponent = Meteor.users.findOne(opponentId);

    var gameAttributes = {
      color: getOppositeColor(currentColor),
      gameLength: this.gameLength,
      size: this.size,
      byoyomi: this.byoyomi,
      rematchOf: this._id
    }

    return user.challenge(opponent._id, gameAttributes);
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
      previousPosition: this.position(),
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



/*
  WGoGame internals
*/

	/**
	 * Gets top (last) position.
	 *
	 * @return {WGo.Position} current position
	 */
	position: function() {
    return Positions.findOne({gameId: this._id}, {sort: {createdAt: 1}});
	},

  /**
   * Gets count of positions (move count)
   *
   * @return integer
   */
   positionCount: function() {
     return Positions.find({gameId: this._id}).count();
   }

  /**
  * Gets nth position played
  *
  * @return Position
  */
	positionAt: function(turn) {
    return Positions.find({gameId: this._id}, {
      sort: {createdAt: -1},
      limit: turn
    }).fetch().pop();
	},


	/**
	 * Play move.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @param {(WGo.B|WGo.W)} c color
	 * @param {boolean} noplay - if true, move isn't played. Used by WGo.Game.isValid.
	 * @return {number} code of error, if move isn't valid. If it is valid, function returns array of captured stones.
	 *
	 * Error codes:
	 * 1 - given coordinates are not on board
	 * 2 - on given coordinates already is a stone
	 * 3 - suicide (currently they are forbbiden)
	 * 4 - repeated position
	 */

	play: function(x,y,c,noplay) {
		//check coordinates validity
		if(!this.isOnBoard(x,y)) return 1;
		if(this.position().get(x,y) != 0) return 2;

		// clone position
		if(!c) c = this.turn;

		var new_pos = this.position().clone();
		new_pos.set(x,y,c);

		// check capturing
		var captured = check_capturing(new_pos, x-1, y, -c).concat(check_capturing(new_pos, x+1, y, -c), check_capturing(new_pos, x, y-1, -c), check_capturing(new_pos, x, y+1, -c));

		// check suicide
		if(!captured.length) {
			var testing = new Position(this.size); //TODO
			if(check_liberties(new_pos, testing, x, y, c)) return 3;
		}

		// check history
		if(this.repeating && !this.checkHistory(new_pos, x, y)) {
			return 4;
		}

		if(noplay) return false;

		// update position info
		new_pos.color = c;
		new_pos.capCount = {
			black: this.position().capCount.black,
			white: this.position().capCount.white
		};
		if(c == WGo.B) new_pos.capCount.black += captured.length;
		else new_pos.capCount.white += captured.length;

		// save position
    this.pushPosition(new_pos);

		// reverse turn
		this.turn = -c;

		return captured;

	},

	/**
	 * Play pass.
	 *
	 * @param {(WGo.B|WGo.W)} c color
	 */

	pass: function(c) {
		if(c) this.turn = -c;
		else this.turn = -this.turn;

		this.pushPosition();
		this.position().color = -this.position().color;
	},

	/**
	 * Finds out validity of the move.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @param {(WGo.B|WGo.W)} c color
	 * @return {boolean} true if move can be played.
	 */

	isValid: function(x,y,c) {
		return typeof this.play(x,y,c,true) != "number";
	},

	/**
	 * Controls position of the move.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @return {boolean} true if move is on board.
	 */

	isOnBoard: function(x,y) {
		return x >= 0 && y >= 0 && x < this.size && y < this.size;
	},

	/**
	 * Inserts move into current position. Use for setting position, for example in handicap game. Field must be empty.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @param {(WGo.B|WGo.W)} c color
	 * @return {boolean} true if operation is successfull.
	 */

	addStone: function(x,y,c) {
		if(this.isOnBoard(x,y) && this.position().get(x,y) == 0) {
			this.position().set(x,y,c || 0);
			return true;
		}
		return false;
	},

	/**
	 * Removes move from current position.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @return {boolean} true if operation is successfull.
	 */

	removeStone: function(x,y) {
		if(this.isOnBoard(x,y) && this.position().get(x,y) != 0) {
			this.position().set(x,y,0);
			return true;
		}
		return false;
	},

	/**
	 * Set or insert move of current position.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @param {(WGo.B|WGo.W)} c color
	 * @return {boolean} true if operation is successfull.
	 */

	setStone: function(x,y,c) {
		if(this.isOnBoard(x,y)) {
			this.position().set(x,y,c || 0);
			return true;
		}
		return false;
	},

	/**
	 * Get stone on given position.
	 *
	 * @param {number} x coordinate
	 * @param {number} y coordinate
	 * @return {(WGo.B|WGo.W|0)} color
	 */

	getStone: function(x,y) {
		if(this.isOnBoard(x,y)) {
			return this.position().get(x,y);
		}
		return 0;
	},

	/**
	 * Add position to stack. If position isn't specified current position is cloned and stacked.
	 * Pointer of actual position is moved to the new position.
	 *
	 * @param {WGo.Position} tmp position (optional)
	 */

	pushPosition: function(pos) {
		if(!pos) {
			var pos = this.position().clone();
			pos.capCount = {
				black: this.position().capCount.black,
				white: this.position().capCount.white
			};
			pos.color = this.position().color;
		}
    return Position.insert(pos);
	},

	/**
	 * Gets count of captured stones.
	 *
	 * @param {(WGo.BLACK|WGo.WHITE)} color
	 * @return {number} count
	 */

	getCaptureCount: function(color) {
		return color == WGo.B ? this.position().capCount.black : this.position().capCount.white;
	},

	/**
	 * Validate postion. Position is tested from 0:0 to size:size, if there are some moves, that should be captured, they will be removed.
	 * You can use this, after insertion of more stones.
	 *
	 * @return array removed stones
	 */

	validatePosition: function() {
		var c, p,
		    white = 0,
			black = 0,
		    captured = [],
		    new_pos = this.position().clone();

		for(var x = 0; x < this.size; x++) {
			for(var y = 0; y < this.size; y++) {
				c = this.position().get(x,y);
				if(c) {
					p = captured.length;
					captured = captured.concat(check_capturing(new_pos, x-1, y, -c),
											   check_capturing(new_pos, x+1, y, -c),
											   check_capturing(new_pos, x, y-1, -c),
											   check_capturing(new_pos, x, y+1, -c));

					if(c == WGo.B) black += captured-p;
					else white += captured-p;
				}
			}
		}
		this.position().capCount.black += black;
		this.position().capCount.white += white;
		this.position().schema = new_pos.schema;

		return captured;
	},

  // analysing history
  checkHistory = function(position, x, y) {
  	var flag, stop;

    var positionCount = this.positionCount();

  	if(this.repeating == "KO" && positionCount-1 >= 0) stop = positionCount-1;
  	else if(this.repeating == "ALL") stop = 0;
  	else return true;

  	for(var i = positionCount-1; i >= stop; i--) {
  		if(this.positionAt(i-1).get(x,y) == position.get(x,y)) {
  			flag = true;
  			for(var j = 0; j < this.size*this.size; j++) {
  				if(this.positionAt(i-1).schema[j] != position.schema[j]) {
  					flag = false;
  					break;
  				}
  			}
  			if(flag) return false;
  		}
  	}

  	return true;
  }
});
