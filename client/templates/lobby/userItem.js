Template.userItem.helpers({
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
