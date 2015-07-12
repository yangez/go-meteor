Template.gamesList.helpers({
  games: function() {
    return Games.find();
  }
});

Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault();

    var gameId = this._id;
    Meteor.call("joinGame", gameId, "white", Meteor.userId(), function(error, game) {
      if (error) return alert(error);
      Router.go('gamePage', { _id: gameId });
    });

  }
});
