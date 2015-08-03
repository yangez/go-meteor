
Template.createGame.helpers({
  button: function() {
    return Session.get("challengeEnabled") ?
    { text: "Challenge", class: "btn-danger"} :
    { text: "Create Game", class: "btn-primary"} ;
  },
  loading: function() {
    return Session.get("createGameLoading") ? "loading" : false;
  }
})

Template.createGame.events({

  'submit form': function(e) {
    e.preventDefault();

    // loading indicator
    Session.set("createGameLoading", true);

    // figure out all game parameters
    var timeEntered = parseInt( $(e.target).find('[name=time-control]').val() );

    if (timeEntered) {
      var timeType = $(e.target).find('[name=time-type]').val();

      if (["minutes", "hours"].indexOf(timeType) === -1) timeType = "minutes";

      var timeInMilliseconds = moment.duration(timeEntered, timeType).asMilliseconds();
    }

    byoPeriods = parseInt( $(e.target).find('[name=by-periods]').val());
    byoTime = parseInt( $(e.target).find('[name=by-time]').val());

    if (byoPeriods && byoTime) {
      var byoTimeType = $(e.target).find('[name=by-time-type]').val();

      if (["minutes", "seconds"].indexOf(byoTimeType) === -1) byoTimeType = "minutes";

      var byoTimeInMilliseconds = moment.duration(byoTime, byoTimeType).asMilliseconds();

      var byoyomi = {
        periods: byoPeriods,
        time: byoTimeInMilliseconds,
      };

      // default game time
      if (!timeInMilliseconds) var timeInMilliseconds = 0;
    }

    var game = {
      size: $(e.target).find('[name=size] option:selected').val(),
      color: $(e.target).find('[name=color]:checked').val(),
      gameLength: timeInMilliseconds,
      byoyomi: byoyomi,
    }

    // if this is a challenge
    if (Session.get("challengeEnabled")) {

      var challengeUsername = $(e.target).find('#challenge-username').val()
      if (!challengeUsername) return showMessage("You need to enter a username to challenge. (Or uncheck the 'challenge' box.)");

      var user = Meteor.users.findOne({"username": challengeUsername})
      if (!user) return showMessage("The user '"+challengeUsername+"' doesn't exist.");

      Meteor.call('challenge/create', game, challengeUsername, function(error, result) {
        if (error) return console.log(error.message);

        // close menu
        $('#create-game-menu').dropdown("toggle");

        // open challenges
        $('#challenges-menu').dropdown("toggle");

        showMessage("Challenge successfully sent to "+result.recipient+".");
      });
    }

    // if this is merely a new game
    else {

      Meteor.call('game/insert', game, Meteor.userId(), function(error, result) {
        if (error) return console.log(error.message);

        // close menu
        $('#create-game-menu').dropdown("toggle");
        Session.set("createGameLoading", undefined);

        Router.go('match', { _id: result._id });
      });
    }

  },

});
