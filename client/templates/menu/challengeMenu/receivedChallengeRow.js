Template.receivedChallengeRow.helpers({
  username: function() {
    var user = Meteor.users.findOne(this.senderId);
    if (user) return user.username;
  },
  timeString: function() {
    var gameAttributes = this.gameAttributes;

    var string = "";

    if (gameAttributes.gameLength > 0) string += timeDisplay(gameAttributes.gameLength, 'letters');
    if (gameAttributes.gameLength > 0 && gameAttributes.byoyomi ) string += " + ";

    if (gameAttributes.byoyomi) {
      string += byoToString(gameAttributes.byoyomi.periods, gameAttributes.byoyomi.time, 'letters');
    }

    return string;
  },
  size: function() {
    return this.gameAttributes.size + "x" + this.gameAttributes.size;
  }
});

Template.receivedChallengeRow.events({
  'click .challenge-decline': function(e) {
    Meteor.call("challenge/decline", this._id, function(e, r) {
      if (e) return console.log(e.message);
    })
  },

  'click .challenge-accept': function(e) {
    Meteor.call("challenge/accept", this._id, function(e, r) {
      if (e) return console.log(e.message);
      Router.go('match', { _id: r.gameId });
    })
  },

});