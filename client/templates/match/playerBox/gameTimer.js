Template.gameTimer.helpers({
  gameIsTimed: function() {
    return this.game.isTimed();
  },
  formattedTime: function() {
    var game = Games.findOne(this.game._id);

    var position = this.position;
    var color = game.getColorOfPosition(position);

    var timeRemaining = game.timeRemaining(color);

    if (timeRemaining) return moment(timeRemaining).format("m:ss");
    else return false;
  }
});
