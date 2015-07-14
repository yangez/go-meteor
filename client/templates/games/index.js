Template.gamesList.helpers({
  games: function() {
    return Games.find({ archived: {$ne: true}} );
  },
});

Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("joinGame", this, color, Meteor.userId(), function(error, result) {
      if (error) return alert(error);
      Router.go('gamePage', { _id: game._id });
    });

  }
});
