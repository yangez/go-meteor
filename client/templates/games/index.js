Template.gamesList.helpers({
  userGames: function() {
    if (!Meteor.userId()) return false;
    return Games.find({ $and: [
      {archived: {$ne: true}}, // not archived
      {$or: [ // player is in game
        {blackPlayerId: Meteor.userId()},
        {whitePlayerId: Meteor.userId()}
      ]}
    ] });
  },
  openGames: function() {
    if (Meteor.userId()) {
      return Games.find({ $and: [
        // game is not archived
        {archived: {$ne: true}},

        // current player not in game
        {blackPlayerId: {$ne: Meteor.userId()}},
        {whitePlayerId: {$ne: Meteor.userId()}}, //

        // game has an open slot
        {$or: [
          {blackPlayerId: {$exists: false}},
          {whitePlayerId: {$exists: false}}
        ]}
      ]});
    } else {
      return Games.find({ $and: [
        // game is not archived
        {archived: {$ne: true}},

        // game has an open slot
        {$or: [
          {blackPlayerId: {$exists: false}},
          {whitePlayerId: {$exists: false}}
        ]}
      ]});
    }
  },
  gamesInProgress: function() {
    return Games.find({ $and: [
      // not archived
      { archived: {$ne: true} },

      // both players exist but are not current player
      {blackPlayerId: {$exists: true, $ne: Meteor.userId()}},
      {whitePlayerId: {$exists: true, $ne: Meteor.userId()}},

    ] });
  },
  completedGames: function() {
    return Games.find({ $and: [
      { archived: true },
      {blackPlayerId: {$exists: true}},
      {whitePlayerId: {$exists: true}},
    ]}, {sort: {gameCreated: 1}}, {limit: 10} );
  },
});


Template.gameItem.helpers({
  joinable: function() {
    return (this.blackPlayerId != Meteor.userId() && this.whitePlayerId != Meteor.userId());
  },
  currentUser: function(color) {
    if (getColorOfPlayerId(this, Meteor.userId()) === color)
      return "current-user"
  },
});

Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault();

    var color = e.target.getAttribute('data-color');

    Meteor.call("joinGame", this, color, Meteor.userId(), function(error, result) {
      if (error) return alert(error);
      Router.go('gamePage', { _id: this._id });
    });

  }
});
