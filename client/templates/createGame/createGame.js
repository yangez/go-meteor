Template.createGame.onRendered(function() {
    // default main time should be enabled
    Session.set("mainTimeEnabled", true);
});

Template.createGame.events({
  'submit form': function(e) {
    e.preventDefault();

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

    Meteor.call('game/insert', game, function(error, result) {
      if (error) return console.log(error.message);
      Router.go('match', { _id: result._id });
    });
  },

});
