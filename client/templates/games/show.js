var scrollMessages = function(speed) {
  if ($(".messages").length > 0) {
    $(".messages").animate({scrollTop:$(".messages")[0].scrollHeight}, speed);
  }
}

Template.gamePage.onRendered(function(){
  scrollMessages(0);
});

Template.gamePage.helpers({
  messages: function(){
    return this.messages;
  },
  messageScroller: function() {
    if (this.messages) scrollMessages();
  },
  toMove: function() {
    if (!this.wgoGame || !isReady(this)) return "Waiting for opponent";
    if (hasPlayer(this, Meteor.userId())) {
      if (isPlayerTurn(this, Meteor.userId())) {
        return "Your move";
      } else {
        return "Opponent's move"
      }
    } else {
      if (this.wgoGame.turn === WGo.B) var color = "Black";
      else var color = "White";
      return color + " to move";
    }
  }
});

Template.gamePage.events({
  'submit #comment-form': function(e) {
    e.preventDefault();

    if (!Meteor.userId()) return false;

    messages = this.messages;
    if (!messages) messages = [];

    var content = $(e.target).find('[name=content]').val();
    if (!content) return false;

    messages.push({
      author: Meteor.user().username,
      content: content
    });

    Games.update({_id: this._id}, {$set: {messages: messages}});

    $(e.target).find('[name=content]').val("");
  },
  'click #archive': function(e) {
    e.preventDefault();
    Games.update({_id: this._id}, {$set: {archived: true}});
    Router.go('gamesList');
  }
});


Template.playerBox.helpers({
  name: function() {
    var player;
    if (this.color === "black") {
      var player = Users.findOne(this.blackPlayerId);
    } else if (this.color === "white") {
      var player = Users.findOne(this.whitePlayerId);
    }
    return player.username;
  },
  joinButton: function(color) {
    game = this.game;
    if (color === "black") {
      if (game.blackPlayerId) return false;
    }
    else if (color === "white" ) {
      if (game.whitePlayerId) return false;
    }
    // if logged in
    if (Meteor.userId()) {
      // if already in game
      if (hasPlayer(game, Meteor.userId())) return false;
      return '<a href="#" class="btn btn-info join-game" data-color="'+color+'">Join Game</a>';
    } else return "<small>Log in or sign up to join this game.</small>"
  },
  turnIndicator : function(color) {
    game = this.game;
    if (color === "white") {
      if (isPlayerTurn(game, game.whitePlayerId))
        return "color: red; font-weight: bold;"
    } else if (color === "black")
      if (isPlayerTurn(game, game.blackPlayerId))
        return "color: red; font-weight: bold;"
    return false;
  },
  youIndicator : function(color) {
    game = this.game;
    if (color === "white") {
      if (game.whitePlayerId === Meteor.userId())
        return "(you)"
    } else if (color === "black") {
      if (game.blackPlayerId === Meteor.userId())
        return "(you)"
    }
    return false;
  },


});

Template.playerBox.events({
  'click .join-game': function(e) {
    e.preventDefault();

    console.log('hi');
    var color = e.target.getAttribute('data-color');

    Meteor.call("joinGame", this.game, color, Meteor.userId(), function(error, result) {
      if (error) return alert(error);

    });

  },
});


// board js
