Template.gamePage.helpers({
  messages: function(){
    return this.messages;
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
    if (!this.wgoGame || !isReady(this.wgoGame)) return "Waiting for opponent";
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
