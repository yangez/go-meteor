Template.gameTimer.helpers({
  gameIsTimed: function() {
    return this.game.isTimed();
  },
  formattedTime: function() {
    var game = Games.findOne(this.game._id);

    var position = this.position;
    var color = game.getColorOfPosition(position);

    var timeRemaining = game.timeRemaining(color);

    if (timeRemaining > 0 || timeRemaining === 0) {

      if (timeRemaining === 0 && !game.archived)
        Meteor.call("game/endOnTime", game._id, color);

      return timeDisplay(timeRemaining);
    } else return false;
  }
});

function timeDisplay(ms) {
  var string;
  var duration = moment.duration(ms);

  var seconds = duration.seconds();
  var minutes = duration.minutes();

  string = minutes + ":" + padToTwo(seconds);

  var hours = duration.hours();
  if (hours) string = hours + ":" + padToTwo(minutes) + ":" + padToTwo(seconds);

  return string;
}

function padToTwo(number) {
  if (number<=99) { number = ("0"+number).slice(-2); }
  return number;
}
