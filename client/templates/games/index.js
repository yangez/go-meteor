Template.gamesList.helpers({
  games: function() {
    return Games.find();
  }
});
Template.gameItem.helpers({
  white: function() {
    return "white_username";
    // return this.whitePlayer.username;
  },
  black: function() {
    return "black_username";
    // return this.whitePlayer.username;
  }
});
Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });

  }
});
