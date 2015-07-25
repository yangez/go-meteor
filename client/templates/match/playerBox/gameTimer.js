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

      game.checkTimerFlag();
      return timeDisplay(timeRemaining);

    } else return false;
  }
});
