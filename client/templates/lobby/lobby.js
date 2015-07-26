Template.lobby.helpers({
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
  	return Messages.find({ room : 'Global' }, {
      limit : 100,
      sort : { time : 1 }
    });
  }
});
