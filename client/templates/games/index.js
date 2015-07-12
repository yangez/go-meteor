Template.gamesList.helpers({
  games: function() {
    return Games.find();
  }
});
Template.gameItem.helpers({
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
Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });

  }
});
