Template.userItem.helpers({
  isWinner: function(color) {
    var game = Template.parentData(1);
    if (color === "black") return game.winnerId === game.blackPlayerId;
    if (color === "white") return game.winnerId === game.whitePlayerId;
  },
  score: function() {
    var game = Template.parentData(1);
    return game.score;
  },
  joinable: function() {
    var game = Template.parentData(1);
    return (game.blackPlayerId != Meteor.userId() && game.whitePlayerId != Meteor.userId());
  },
  currentUserColor: function(color) {
    var game = Template.parentData(1);
    if (game.getColorOfPlayerId(Meteor.userId()) === color)
      return "current-user"
  },
  username: function(color) {
    var game = Template.parentData(1);
    user = game.getPlayerAtColor(color);
    if (user) return user.username;
    else return false;
  },
  currentMove: function(color) {
    var game = Template.parentData(1);
    moveColor = game.getColorOfCurrentMove();
    return moveColor === color;
  }

});
