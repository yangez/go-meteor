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
  * challenges (uses notifications system)
  */

  // issue challenge to userId from current user
  challenge: function(userId, gameData) {
    var challenger = Meteor.user();
    if (!challenger) throw new Meteor.Error("User isn't logged in.");

    var challenged = Meteor.users.findOne(userId);
    if (!challenged) throw new Meteor.Error("This user doesn't exist.");

    else if (challenged._id === Meteor.userId())
      throw new Meteor.Error("You can't challenge yourself.");

    challenged.sendNotification("challengeNew", {
      challengerId: challenger._id,
      gameData: gameData
    });

    return {
      recipient: challenged.username
    }
  },

  // decline challenge
  declineChallenge: function(challengeId) {

    var notification = Herald.collection.findOne(challengeId)
    if (notification.courier !== "challengeNew")
      throw new Meteor.Error("Notification is not a challenge.");

    // notify the sender that their challenge was declined (later)

    // var sender = Meteor.users.findOne(notification.data.challengerId);
    // sender.sendNotification("challengeDeclined", { _id: notification._id });

    // remove the notification
    var user = Meteor.user();
    user.readNotification(notification._id);

  },

  // accept challenge
  acceptChallenge: function(challengeId) {
    var challenge = Herald.collection.findOne(challengeId)
    if (challenge.courier !== "challengeNew")
      throw new Meteor.Error("Notification is not a challenge.");

    var user = Meteor.user();
    if (challenge.userId !== user._id)
      throw new Meteor.Error("Challenge doesn't belong to this user.");

    var data = challenge.data;

    // create new game with gameData
    var gameId = Game.create(data.gameData, data.challengerId);
    if (!gameId)
      throw new Meteor.Error("Couldn't create game.");

    // join the game
    var game = Games.findOne(gameId);
    game.joinOpponentId(user);

    // remove the notification
    user.readNotification(challengeId);

    // notify the sender that their challenge was accepted


    return {
      _id: game._id,
      result: true,
    }
  },

  /*
   * notifications
   */

  // kinds: ["yourTurn", "challengeReceived",]
  sendNotification: function(kind, data) {
    if (Meteor.isClient) return false; // only send server-side

    if ([ "yourTurn", "challengeNew", "challengeAccepted", "challengeDeclined" ].indexOf(kind) > -1) {

      return Herald.createNotification(this._id, {
        courier: kind,
        data: data
      });

    }

  },

  // mark notification as read
  readNotification: function(notificationId) {
    if (this._id !== Meteor.userId())
      throw new Meteor.Error("User not authorized to mark notification as read.");

    return Herald.collection.update(notificationId, {$set: {read: true}});
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
