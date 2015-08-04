Template.actionButtons.helpers({
  gameEnded: function() {
    return this.game.archived;
  },
  isBottom: function() {
    return this.position == "bottom";
  },
  markingDead: function() {
    if (!this.game) return false;
    return this.game.markingDead();
  },
  mdDisabled: function() {
    if (!this.game) return false;
    var game = Games.findOne(this.game._id); // refresh
    return (game.userAcceptedMD === Meteor.userId()) ? "disabled" : "";
  },
  cancelable: function() {
    return !this.game.isPlaying();
  },
  undoRequested: function() {
    return this.game.undoRequested;
  },
  userInGame: function() {
    return this.game.hasPlayerId(Meteor.userId());
  }

});


Template.actionButtons.events({
  'click #cancel-game': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "cancel", function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
  'click #undo-game': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "requestUndo", function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
  'click #pass-game': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "pass", function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
  'click #resign-game': function(e) {
    e.preventDefault();
    var game = this.game;

    $.confirm({
      title: 'Really resign?',
      content: 'Are you sure you want to resign? (This action is irreversible.)',
      confirmButton: "Yes",
      confirmButtonClass: "btn-danger",
      cancelButton: "No",
      theme: "supervan",
      confirm: function(){
        Meteor.call('game/action', game._id, "resign", function(error, result) {
          if (error) return console.log(error.message);
        });
      }
    });
  },
  'click #md-decline': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "declineMD", function(error, result) {
      if (error) return console.log(error.message);
    });
  },
  'click #md-accept': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "acceptMD", function(error, result) {
      if (error) return console.log(error.message);
    });
  },

});
