Template.gameRow.events({
  'click tr': function(e) {
    e.preventDefault();
    var game = Template.currentData();

    Router.go('match', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault(); // e.preventPropagate() see if it gets rid of error message?

    var color = e.target.getAttribute('data-color');
    // var game = this;

    var game = Template.currentData();

    Meteor.call("game/join", game._id, color, function(error, result) {
      if (error) return alert(error);
      Router.go('match', { _id: game._id });
    });

  }
});

Template.gameRow.helpers({
  turn: function() {
    return this.currentMove();
  },

  timeString: function() {
    if (!this.isTimed()) return false;

    this.checkTimerFlag();
    var string = "";

    if (this.gameLength > 0) string += timeDisplay(this.gameLength, 'letters');

    if (this.gameLength > 0 && this.isTimed() === "byoyomi") string += " + ";

    if (this.isTimed() === "byoyomi") {
      string += byoToString(this.byoyomi.periods, this.byoyomi.time, 'letters');
    }

    return string;
  }
});
