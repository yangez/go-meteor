Template.gamePage.helpers({
  messages: function(){
    return this.messages;
  },
  joinButton: function(color) {
    if (color === "black") {
      if (this.blackPlayerId) return false;
    }
    else if (color === "white" ) {
      if (this.whitePlayerId) return false;
    }
    // if logged in
    if (Meteor.userId()) {
      // if already in game
      if (hasPlayer(this, Meteor.userId())) return false;
      return '<a href="#" class="btn btn-info join-game" data-color="'+color+'">Join Game</a>';
    } else return "<small>Log in or sign up to join this game.</small>"
  },
  turnIndicator : function(color) {
    if (color === "white") {
      if (isPlayerTurn(this, this.whitePlayerId))
        return "color: red; font-weight: bold;"
    } else if (color === "black")
      if (isPlayerTurn(this, this.blackPlayerId))
        return "color: red; font-weight: bold;"
    return false;
  },
  youIndicator : function(color) {
    if (color === "white") {
      if (this.whitePlayerId === Meteor.userId())
        return "(you)"
    } else if (color === "black") {
      if (this.blackPlayerId === Meteor.userId())
        return "(you)"
    }
    return false;
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
  'click .join-game': function(e) {
    e.preventDefault();
    console.log('hi');

    var color = e.target.getAttribute('data-color');
    console.log(color);

    Meteor.call("joinGame", this, color, Meteor.userId(), function(error, result) {
      if (error) return alert(error);
    });
  },
  'submit #comment-form': function(e) {
    e.preventDefault();

    if (!Meteor.userId()) return false;

    messages = this.messages;
    if (!messages) messages = [];
    
    messages.push({
      author: Meteor.user().username,
      content: $(e.target).find('[name=content]').val(),
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


// board js
