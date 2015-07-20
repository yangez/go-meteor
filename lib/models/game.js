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
    var game = Games.findOne(this._id);

    // if game hasn't had a markdead stage yet, do the markdead stage
    if (!game.markedDead)  {
      markDead(game);
      pushMessage(game, "Mark dead stones and 'Accept' to finish the game. 'Decline' to play it out.", GAME_MESSAGE );
    }

    // if we've already marked dead once, end game immediately
    else {
      game.removeMDMarks();

      var score = getFinalScore(game);
      Games.update({_id: game._id}, {$set: {archived: true, endedAt: new Date()} });

      var message = "Game ended. Final score: "+score+".";
      pushMessage(game, message, GAME_MESSAGE);
    }

    return true;
  },

/*
 * MarkDead methods
 */

  // call when someone declines in MarkDead
  declineMD: function() {
    var game = Games.findOne(this._id);
    if(!game.markingDead()) return false;

    // remove all marked stones
    game.removeMDMarks();

    // unset markedSchema so game will not be in markDead mode anymore
    Games.update({_id: game._id}, {
      $unset: { markedSchema: "" }
    });

    var message = Meteor.user().username+" declined, so play continues. Game will now end immediately after two passes, so capture all dead stones first.";
    pushMessage(game, message, GAME_MESSAGE);

  },

  // remove "accepted" status of MarkDead
  clearAcceptMD: function() {
    if (this.userAcceptedMD)  {
      Games.update({_id: this._id}, { $unset: { userAcceptedMD: "" } });
    }
  },

  // call when someone clicks "Accept" in MarkDead
  acceptMD: function() {
    game = Games.findOne(this._id);
    if(!game.markingDead()) return false;

    // if the other guy has already accepted markDead, end game
    if (game.userAcceptedMD && game.userAcceptedMD != Meteor.userId()) {
      game.endGame();
    } else { // first person to accept markDead gets it set
      Games.update({_id: game._id}, { $set: { userAcceptedMD: Meteor.userId() } });
    }
  },


/*
 * State checks
 */

  // check whether we're in MarkDead state
  markingDead: function() {
    // game.markedSchema gets cleared if we leave markedDead mode
    return (this.markedDead && !this.archived && this.markedSchema) ? true : false;
  },

/*
 * Utility methods
 */

  // function to remove all markdead marks
  removeMDMarks: function() {
    var game = Games.findOne(this._id);
    Games.update({_id: game._id}, {
      $set: { boardState: game.originalBoardState },
      $unset: { originalBoardState: "", }
    });
  },
});
