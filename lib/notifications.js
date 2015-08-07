/* Your Turn notification */
Herald.addCourier('yourTurn', {
  media: {
    onsite: {}, // Send notifications to client, with no custom configuration
    webNotification: {
      title: "Your move",
      body: function() {
        var game = Games.findOne(this.data.gameId);

        var size = game.size+"x"+game.size;
        var color = game.getColorOfPlayerId(Meteor.userId());
        var opponent = Meteor.users.findOne(game.getOpponentId())
        
        return "It's your turn to move in your "+size+" game as "+color+" against "+opponent.username+".";
      },
      icon: "/chat.icon"
    }
  },
});

Herald.addCourier('challengeNew', {
  media: { onsite: {} },
});

Herald.addCourier('challengeAccepted', {
  media: { onsite: {} },
});

Herald.addCourier('challengeDeclined', {
  media: { onsite: {} },
});
