// DANGER: this allows anyone to update any other user. Remove this asap, especially before release
Meteor.users.allow({
  update: function(userId) {
    if (userId) return true;
  }
})


/*
# User
- emails: []
- profile: { age, description, displayName={}, location }
- username
- meta: {
  notifications: { }
}
*/


Meteor.users.helpers({

  /*
   * notifications
   */

  // kinds: ["yourTurn", "challengeReceived",]
  sendNotification: function(kind, options) {
    if (kind === "yourTurn") {
      var game = Games.findOne(options.gameId);
      if (!game) throw new Meteor.Error("Game does not exist.");

      var opponentId = game.getOpponentId();
      var opponent = Meteor.users.findOne(opponentId);
      var color = game.getColorOfPlayerId(this._id);

      Herald.createNotification(this._id, {
        message: "It's your turn to move in your "+game.size+"x"+game.size+" game as "+color+" against "+opponent.username+".",
      })

    }
  },

  /*

  sendYourTurnNotification: function(gameId, method) {
    var game = Games.findOne(gameId);
    if (!game.isCurrentPlayerMove()) return false;

    var opponentId = game.getOpponentId();
    var opponent = Meteor.users.findOne(opponentId);
    var color = game.getColorOfPlayerId(this._id);
    var turn = game.getCurrentMoveNumber();

    var notification = this.getMeta("notification");
    if (notification && notification.turn === turn) return false;

    notify.createNotification("Your move", {
      body: "It's your turn to move in your "+game.size+"x"+game.size+" game as "+color+" against "+opponent.username+".",
      icon: "/chat.ico"
    });

    this.updateMeta("notification", {
      type: "turn",
      turn: turn,
      method: "browser",
      sentAt: new Date(),
    });
  },
  */


  // private

  updateMeta: function(type, obj) {
    var meta = this.meta ? this.meta : {};
    meta[type] = meta[type] ? meta[type] : {};

    _.forOwn(obj, function(value, key) {
      meta[type][key] = value;
    });

    var set = { "meta": meta };

    Meteor.users.update({_id: this._id}, {$set: set });
  },

  getMeta: function(type) {
    if (this.meta) return this.meta[type];
  }
});
