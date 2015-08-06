Template.challengeNewItem.helpers({
  opponent: function() {
    var user = Meteor.users.findOne(this.data.challengerId);
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

});

Template.challengeNewItem.events({

});
