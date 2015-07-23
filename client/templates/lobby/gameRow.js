Template.gameRow.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('match', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault(); // e.preventPropagate() see if it gets rid of error message?

    var color = e.target.getAttribute('data-color');
    // var game = this;

    var game = Template.currentData();

    Meteor.call("game/join", game, color, function(error, result) {
      if (error) return alert(error);
      Router.go('match', { _id: game._id });
    });

  }
});
