/* Challenge schema upon creation
  gameAttributes: gameAttributes,
  senderId: Meteor.userId(),
  recipientId: user._id,
  sentAt: new Date(),
  acceptedAt: undefined,
  declined: undefined,
  canceled: undefined

*/

Challenge = function(doc) {
  _.extend(this, doc);
};

_.extend(Challenge.prototype, {

  /* Functionality */
  accept: function() {
    return this.respond("accept");
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

  /* State checks */

  isAccepted: function() { return this.acceptedAt ? true : false;
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
