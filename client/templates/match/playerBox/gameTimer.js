Template.gameTimer.helpers({
  gameIsTimed: function() {
    return this.game.isTimed();
  },
  formattedTime: function() {
    var game = Games.findOne(this.game._id);

    var position = this.position;
    var color = game.getColorOfPosition(position);

    var totalTimeLeft = game.totalTimeLeft(color);
    var absTimeLeft = game.absTimeLeft(color);
    var byoTimeLeft = game.byoTimeLeft(color);

    if (totalTimeLeft >= 0) {
      var byoFormatted = game.byoFormatTimeLeft(color);

      return {
        absolute: timeDisplay(absTimeLeft),
        byoyomi: byoFormatted
      }

    } else return false;
  },
  absRunning: function() {
    var game = Games.findOne(this.game._id);
    if (!game.isTimed()) return false;

    var position = this.position;
    var color = game.getColorOfPosition(position);
    var absTimeLeft = game.absTimeLeft(color);

    return (absTimeLeft > 0);

  },
  byoRunning: function() {
    var game = Games.findOne(this.game._id);
    if (game.isTimed() !== "byoyomi") return false;

    var position = this.position;
    var color = game.getColorOfPosition(position);
    var absTimeLeft = game.absTimeLeft(color);

    return (absTimeLeft === 0);
  }
});
