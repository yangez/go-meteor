Template.gamePage.helpers({
  white: function() {
    return this.whitePlayer.username || null;
    // return this.whitePlayer.username;
  },
  black: function() {
    blackPlayer = Meteor.users.findOne({_id: this.blackPlayerId});
    return blackPlayer.username || null;
    // return this.whitePlayer.username;
  }
});
