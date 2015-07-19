Template.gamesList.helpers({
  userGames: function() {
    if (!Meteor.userId()) return false;
    return Games.find({ $and: [
      {archived: {$ne: true}}, // not archived
      {$or: [ // player is in game
        {blackPlayerId: Meteor.userId()},
        {whitePlayerId: Meteor.userId()}
      ]},
      // game has no open slot
      {blackPlayerId: {$exists: true}},
      {whitePlayerId: {$exists: true}}
    ] }, { sort: { lastActivityAt: -1 } });
  },
  openGames: function() {
    return Games.find({ $and: [
      // game is not archived
      {archived: {$ne: true}},

      // game has an open slot
      {$or: [
        {blackPlayerId: {$exists: false}},
        {whitePlayerId: {$exists: false}}
      ]}
    ]}, { sort: { createdAt: -1 } });
  },
  gamesInProgress: function() {
    return Games.find({ $and: [
      // not archived
      { archived: {$ne: true} },

      // both players exist but are not current player
      {blackPlayerId: {$exists: true, $ne: Meteor.userId()}},
      {whitePlayerId: {$exists: true, $ne: Meteor.userId()}},

    ]}, { sort: { lastActivityAt: -1 } });
  },
  completedGames: function() {
    return Games.find({ $and: [
      { archived: true },
      {blackPlayerId: {$exists: true}},
      {whitePlayerId: {$exists: true}},
    ]}, {sort: { endedAt : -1 } } );
  },
});


Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault(); // e.preventPropagate() see if it gets rid of error message?

    var color = e.target.getAttribute('data-color');
    // var game = this;

    var game = Template.currentData();

    Meteor.call("joinGame", game, color, Meteor.userId(), function(error, result) {
      if (error) return alert(error);
      Router.go('gamePage', { _id: game._id });
    });

  }
});

Template.userRow.helpers({
  joinable: function() {
    var game = Template.parentData(1);
    return (game.blackPlayerId != Meteor.userId() && game.whitePlayerId != Meteor.userId());
  },
  currentUserColor: function(color) {
    var game = Template.parentData(1);
    if (getColorOfPlayerId(game, Meteor.userId()) === color)
      return "current-user"
  },
  username: function(color) {
    var game = Template.parentData(1);
    user = getPlayerAtColor(game, color);
    if (user) return user.username;
    else return false;
  },
  currentMove: function(color) {
    var game = Template.parentData(1);
    moveColor = getCurrentMove(game);
    return moveColor === color;
  }

});
