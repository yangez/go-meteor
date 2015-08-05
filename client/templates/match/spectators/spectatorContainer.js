Template.spectatorContainer.helpers({
  hasSpectators: function() {
    var game = this;
    var presences = Presences.find({"state.currentGameId": game._id}).fetch();
    var players = [game.whitePlayerId, game.blackPlayerId];
    var userIds = [];
    var spectators = presences.filter(function(user) {
      if (userIds.indexOf(user.userId) >= 0 || players.indexOf(user.userId) >= 0) {
        return false;
      } else {
        userIds.push(user.userId);
        return true;
      }
    });

    if (spectators.length > 0) {
      return true;
    } else {
      return false;
    }
  }
});
