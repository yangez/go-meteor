Template.lobby.helpers({
  latestGame: function() {
    return Tracker.nonreactive(function() {
      var game = Games.findOne({ $and: [
        { lastMoveAt: {$exists: true} },
        { blackPlayerId: {$exists: true } },
        { whitePlayerId: {$exists: true } },
      ] }, { sort: { lastMoveAt: -1 } });
      if (game) return game;
    });
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
  globalChatRoom: function(){
  	return Chatrooms.findOne({name : 'Global'});
  },
});
