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
    var color = this.game.getColorOfPosition(this.position);
    if (color === "white") var wgoColor = WGo.W;
    else if (color === "black") var wgoColor = WGo.B;
    if (wgoColor) var theCount = this.game.getCaptureCount(wgoColor);
    if (theCount > 0) return theCount;
  },
  score: function() {
    var game = this.game;
    if (game.archived && game.winnerId && game.score) {
      var color = game.getColorOfPlayerId(game.winnerId);
      var positionColor = game.getColorOfPosition(this.position);
      if (color === positionColor) return game.score;
    }
  },
  undoRequested: function() {
    var game = this.game;
    if (
      this.position !== "top" ||
      !game.undoRequested ||
      !game.hasPlayerId(Meteor.userId())
    ) return false;
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    return (user._id === game.undoRequested) ? "undo-requested" : false;
  }

});

Template.playerBox.events({
  'click .user': function(e) {
    var color = this.game.getColorOfPosition(this.position);
    var user = this.game.getPlayerAtColor(color);
    Router.go('userProfile', { username : user.username });
  },
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("game/join", this.game._id, color, function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
  'click .login-prompt': function(e) {
    e.preventDefault();
    e.stopPropagation();
    $("html, body").animate({ scrollTop: 0 }, 200);
    $("#login-dropdown-list .dropdown-toggle").dropdown('toggle');
  },
  'click #undo-accept': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "acceptUndo", function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
  'click #undo-deny': function(e) {
    e.preventDefault();
    Meteor.call('game/action', this.game._id, "denyUndo", function(error, result) {
      if (error) return showMessage(error.message);
    });
  },
})
