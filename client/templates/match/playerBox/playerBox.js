Template.playerBox.helpers({
  userIsOnline: function() {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    var object = Presences.findOne({userId: user._id});
    return (object && object.state);
  },
  userPresent: function() {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    return this.game.userIdPresent(user._id) ? "in-game" : "";
  },
  captureCount: function() {
    if (!this.game.wgoGame) return false;
    var color = this.game.getColorOfPosition(this.position);
    if (color === "white") var wgoColor = WGo.W;
    else if (color === "black") var wgoColor = WGo.B;
    if (wgoColor) var theCount = this.game.wgoGame.getCaptureCount(wgoColor);
    if (theCount > 0) return theCount;
  },
  score: function() {
    var game = this.game;
    if (game.archived && game.winnerId && game.score) {
      var color = game.getColorOfPlayerId(game.winnerId);
      var positionColor = game.getColorOfPosition(this.position);
      if (color === positionColor) return game.score;
    }
  }

});

Template.playerBox.events({
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("game/join", this.game._id, color, function(error, result) {
      if (error) return alert(error);
    });
  },
  'click .login-prompt': function(e) {
    e.preventDefault();
    e.stopPropagation();
    $("html, body").animate({ scrollTop: 0 }, 200);
    $("#login-dropdown-list .dropdown-toggle").dropdown('toggle');
  },
  'click #pass-game': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "pass", function(error, result) {
      if (error) return console.log(error.message);
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
