Template.createGame.events({
  'submit form': function(e) {
    e.preventDefault();

    var timeEntered = parseInt( $(e.target).find('[name=time-control]').val() );
    if (timeEntered) var timeInMilliseconds = moment.duration(timeEntered, "minutes").asMilliseconds();

    var game = {
      size: $(e.target).find('[name=size] option:selected').val(),
      color: $(e.target).find('[name=color]:checked').val(),
      gameLength: timeInMilliseconds,
    }

    Meteor.call('game/insert', game, function(error, result) {
      if (error) return console.log(error.message);
      Router.go('match', { _id: result._id });
    });
  },

  'change #enable-timer': function(e) {
    element = e.target;
    Session.set("newGameTimerEnabled", element.checked);
  }
});

Template.createGame.helpers({
  timerEnabled: function(e) {
    debugger;
    return Session.get("newGameTimerEnabled");
  }
});
