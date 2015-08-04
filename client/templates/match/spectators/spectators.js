Template.spectator.helpers({
	user: function(){
		return Meteor.users.findOne({_id : this.userId});
	},
	spectators: function() {
		var game = this.gameData;
		var presences = Presences.find({"state.currentGameId": game._id}).fetch();
	  var players = [game.whitePlayerId, game.blackPlayerId];
	  var userIds = [];
	  return presences.filter(function(user) {
	    if (userIds.indexOf(user.userId) >= 0 || players.indexOf(user.userId) >= 0) {
	      return false;
	    } else {
	      userIds.push(user.userId);
	      return true;
	    }
	  });
	}
})
