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

    gameId = Games.update({_id: this._id}, {$set: { whitePlayerId: Meteor.userId() } } );
    Router.go('gamePage', { _id: this._id });

  }
});
