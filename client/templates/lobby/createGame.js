Template.createGame.events({
  'click #time-type-display': function(e) {
    e.preventDefault();
    $type = $("#time-type");
    if ( $type.val() === "minutes" ) {
      $type.val("hours");
      $("#time-control").val(2);
      $("#time-type-display").html("hours");
    } else if ($type.val() === "hours") {
      $type.val("minutes");
      $("#time-control").val(30);
      $("#time-type-display").html("minutes");
    }
  },
  'click #by-time-type-display': function(e) {
    e.preventDefault();
    $type = $("#by-time-type");
    if ( $type.val() === "minutes" ) {
      $type.val("seconds");
      $("#by-time").val(30);
      $("#by-time-type-display").html("secs");
    } else if ($type.val() === "seconds") {
      $type.val("minutes");
      $("#by-time").val(1);
      $("#by-time-type-display").html("mins");
    }
  },
  'submit form': function(e) {
    e.preventDefault();

    var timeEntered = parseInt( $(e.target).find('[name=time-control]').val() );

    if (timeEntered) {
      var timeType = $(e.target).find('[name=time-type]').val();

      if (["seconds", "minutes", "hours"].indexOf(timeType) === -1) timeType = "minutes";

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

  'change #enable-timer': function(e) {
    element = e.target;
    Session.set("newGameTimerEnabled", element.checked);
  }
});

Template.createGame.helpers({
  timerEnabled: function(e) {
    return Session.get("newGameTimerEnabled");
  }
});
