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


    /*old
    var absTimeRemaining = game.absTimeRemaining(color);
    var byoTimeRemaining = game.byoTimeRemaining(color);

    var totalTimeRemaining = absTimeRemaining + byoTimeRemaining;


    if (totalTimeRemaining > 0 || totalTimeRemaining === 0) {

      game.checkTimerFlag();

      var byoFormatted = game.byoFormatTimeRemaining(color);

      return {
        absolute: timeDisplay(absTimeRemaining),
        byoyomi: byoFormatted,
      }

    } else return false;
    */
  }
});
