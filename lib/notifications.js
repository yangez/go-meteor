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
      icon: "/chat.icon",
      onRun: function() {
        // only run if page is hidden
        return document.hidden ? this.run() : this.stop();
      }
    }
  },
});

Herald.addCourier('challengeNew', {
  media: {
    onsite: {},
    email: {
      emailRunner: function(user) {
        var to = user.getEmail();
        if (!to) throw new Meteor.Error("User doesn't have an email.");

        var challenger = Meteor.users.findOne(this.data.senderId);
        var gameData = this.data.gameData;
        var size = gameData.size + "x" + gameData.size;

        var text = "Hi "+user.username+". "+challenger.username+" challenged you to a new "+size+" game of Go. Respond here: " + Router.routes.lobby.url();

        // only send if user is currently not online
        if (!user.status.online)
          Email.send({
            to: to,
            from: "Online Go <no-reply@onlinego.net>",
            subject: "New challenge from "+challenger.username,
            text: text
          });

      }
    },
  },
});

Herald.addCourier('challengeAccepted', {
  media: { onsite: {} },
});

Herald.addCourier('challengeDeclined', {
  media: { onsite: {} },
});
