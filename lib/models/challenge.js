/* Challenge schema upon creation
  gameAttributes: gameAttributes,
  senderId: Meteor.userId(),
  recipientId: user._id,
  sentAt: new Date(),
  acceptedAt: undefined,
  gameId: undefined
  declined: undefined,
  canceled: undefined
  acknowledged: undefined

*/

Challenge = function(doc) {
  _.extend(this, doc);
};

Challenge.create = function(gameAttributes, challengeUserId) {
  var challenged = Meteor.users.findOne(challengeUserId)

  if (!challenged || !Meteor.userId())
    throw new Meteor.Error("Challenge failed to create.");

  else if (challenged._id === Meteor.userId())
    throw new Meteor.Error("You can't challenge yourself.");

  var challengeId = Challenges.insert({
    gameAttributes: gameAttributes,
    senderId: Meteor.userId(),
    recipientId: challenged._id,
    sentAt: new Date(),
  });

  if (!challengeId) throw new Meteor.Error("Challenge couldn't be created.");
  return challengeId;
};

_.extend(Challenge.prototype, {

  /* Functionality */
  accept: function() {
    if (this.respond("accept")) {
      var gameId = Game.create(this.gameAttributes, this.senderId);

      var game = Games.findOne(gameId);
      game.joinOpponentId(this.recipientId);

      Challenges.update({_id: this._id}, { $set: {
        gameId: game._id,
      } });

      return {
        _id: game._id,
        result: true,
      }
    }
  },

  decline: function() {
    return this.respond("decline");
  },

  // cancel challenge that you yourself issued
  cancel: function() {
    var sender = Meteor.users.findOne(this.senderId);

    if (sender && sender._id === Meteor.userId()) {
      Challenges.update({_id: this._id}, { $set: {
        canceled: true,
      } });
      return true;
    }
    return false;
  },

  acknowledge: function() {
    var sender = Meteor.users.findOne(this.senderId);

    if (sender && sender._id === Meteor.userId()) {
      Challenges.update({_id: this._id}, { $set: {
        acknowledged: true,
      } });
      return { result: true, gameId: this.gameId };
    }
    return false;
  },

  /* State checks */

  isAccepted: function() {
    return this.acceptedAt ? true : false;
  },

  // sender has acknowledged that this challenge has been accepted
  isAcknowledged: function() {
    return this.acceptedAt && this.acknowledged;
  },

  isPending: function() {
    return !this.isAccepted() && !this.isDeclined() && !this.isCanceled();
  },

  isDeclined: function() {
    return this.declined;
  },

  isCanceled: function() {
    return this.canceled;
  },

  /* private */

  respond: function(response) {
    if (["accept", "decline"].indexOf(response) === -1) var response = "decline";

    var recipient = Meteor.users.findOne(this.recipientId);

    // if recipient is the one currently accepting the challenge
    if (recipient && recipient._id === Meteor.userId()) {

      if (response === "accept") {
        Challenges.update({_id: this._id}, { $set: {
          acceptedAt: new Date(),
        } });
      }

      else if (response === "decline") {
        Challenges.update({_id: this._id}, { $set: {
          declined: true,
        } });
      }
      return true;

    }
    return false;
  },


});
