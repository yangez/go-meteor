Template.lobby.onCreated(function(){

  // find latest game once, so we can display it on the lobby
  // Note: this is not a reactive helper bc we don't want it to flicker b/w games
  var latestGame = Games.findOne({ $and: [
    { archived: {$ne: true} },
    { lastMoveAt: {$exists: true} },
    { blackPlayerId: {$exists: true } },
    { whitePlayerId: {$exists: true } },
  ] }, { sort: { lastMoveAt: -1 } });

  if (latestGame) Session.set("latestGameId", latestGame._id)

});

Template.lobby.onDestroyed(function() {
  Session.set("latestGameId", undefined);
});


Template.lobby.helpers({
  latestGame: function() {
    var game = getLatestGame();
    if (game) return game;
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

var getLatestGame = function() {
  var gameId = Session.get("latestGameId");
  var game = Games.findOne(gameId);
  if (game) return game;
}
