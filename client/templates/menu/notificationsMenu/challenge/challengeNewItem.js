Template.challengeNewItem.helpers({
  opponent: function() {
    var user = Meteor.users.findOne(this.data.senderId);
    return user.username;
  },
  size: function() {
    return this.data.gameData.size + "x" + this.data.gameData.size;
  },
  color: function() {
    return getOppositeColor(this.data.gameData.color);
  },
  timeString: function() {
    var gameAttributes = this.data.gameData;

    var string = "";

    if (gameAttributes.gameLength > 0) string += timeDisplay(gameAttributes.gameLength, 'letters');
    if (gameAttributes.gameLength > 0 && gameAttributes.byoyomi ) string += " + ";

    if (gameAttributes.byoyomi) {
      string += byoToString(gameAttributes.byoyomi.periods, gameAttributes.byoyomi.time, 'letters');
    }

    return string;
  },
  type: function() {
   return this.data.gameData.rematchOf ? "Rematch request" : "New challenge"
  }

});

Template.challengeNewItem.events({
  'click .mark-read': function(e) {
    e.stopPropagation();
  },
  'click .challenge-decline': function(e) {
    Meteor.call("user/declineChallenge", this._id);
    e.stopPropagation();
  },
  'click .challenge-accept': function(e) {
    Meteor.call("user/acceptChallenge", this._id, function(error, result){
      if (error) return showMessage(error.message);

      Router.go("match", {_id: result._id});
    });
  },
});
