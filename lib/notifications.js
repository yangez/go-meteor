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
    webNotification: {
      title: "New challenge",
      body: function() {
        var challenger = Meteor.users.findOne(this.data.senderId);
        var gameData = this.data.gameData;
        var size = gameData.size + "x" + gameData.size;

        return "You've received a new "+size+" challenge from "+challenger.username+". Click to respond.";
      },
      icon: "/chat.icon",
      onRun: function() {
        // only run if page is hidden
        return document.hidden ? this.run() : this.stop();
      }
    },
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
  media: {
    onsite: {},
    webNotification: {
      title: "Challenge accepted",
      body: function() {
        var recipient = Meteor.users.findOne(this.data.recipientId);

        return recipient.username+" accepted your game challenge. Click to go to the game.";
      },
      icon: "/chat.icon",
      onRun: function() {
        // only run if page is hidden
        return document.hidden ? this.run() : this.stop();
      }
    },
    email: {
      emailRunner: function(user) {
        var to = user.getEmail();
        if (!to) throw new Meteor.Error("User doesn't have an email.");

        var recipient = Meteor.users.findOne(this.data.recipientId);
        var game = Games.findOne(this.data.gameId);

        var size = game.size + "x" + game.size;

        var text = "Hi "+user.username+". "+recipient.username+" accepted your "+size+" Go challenge and a game was created: " + Router.routes.match.url({_id: game._id });

        // only send if user is currently not online
        if (!user.status.online)
          Email.send({
            to: to,
            from: "Online Go <no-reply@onlinego.net>",
            subject: recipient.username + " accepted your challenge",
            text: text
          });

      }

    }
  },

});

Herald.addCourier('challengeDeclined', {
  media: { onsite: {} },
});
