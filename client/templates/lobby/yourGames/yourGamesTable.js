Template.yourGamesTable.events({
  "change .your-move-filter": function (e) {
    Session.set("yourMoveOnly", e.target.checked);
  }
});
Template.yourGamesTable.helpers({
  yourMoveOnly: function() {
    return (Session.get("yourMoveOnly"));
  },
  games: function() {
    if (!Meteor.userId()) return false;
    if (!Session.get("yourMoveOnly")) {
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
    } else {
      // return where it's current players' move
      return Games.find({ $and: [
        // not archived
        {archived: {$ne: true}},

        // game has no open slot
        {blackPlayerId: {$exists: true}},
        {whitePlayerId: {$exists: true}},

        // player isn't in MD and already accepted
        {userAcceptedMD: {$ne: Meteor.userId() }},

        {$or: [
          // player is in MD and hasn't accepted
          {$and: [
            {markedDead: true},
            {markedSchema: {$exists: true} },
          ]},

          // it's the player's move (and they're in-game)
          {$or: [
            {$and:[
              {blackPlayerId: Meteor.userId()},
              {"wgoGame.turn": 1 }
            ]},
            {$and:[
              {whitePlayerId: Meteor.userId()},
              {"wgoGame.turn": -1 }
            ]},
          ]},

        ]}
        // return (this.markedDead && !this.archived && this.markedSchema) ? true : false;

        // { wgoGame.turn: currentPlayerColor }
      ] }, { sort: { lastActivityAt: -1 } });
    }
  },
});
