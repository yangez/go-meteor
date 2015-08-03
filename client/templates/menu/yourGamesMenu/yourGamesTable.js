Template.yourGamesTable.onRendered(function(){
  Session.set("YGyourMoveOnly", true);
});

Template.yourGamesTable.events({
  "change .your-move-filter": function (e) {
    Session.set("YGyourMoveOnly", e.target.checked);
  },
  "change .is-timed-filter": function (e) {
    Session.set("YGisTimed", e.target.checked);
  },
  // "click .filter": function(e) {
  // },
  "click .games-panel": function(e) {
    e.stopPropagation();
  }
});
Template.yourGamesTable.helpers({
  yourMoveOnly: function() {
    return (Session.get("YGyourMoveOnly"));
  },
  isTimed: function() {
    return (Session.get("YGisTimed"));
  },
  games: function() {
    if (!Meteor.userId()) return false;
    var and = [
      {archived: {$exists: false}}, // not archived

      // game has no open slot
      {blackPlayerId: {$exists: true}},
      {whitePlayerId: {$exists: true}},

      // player is in game
      {$or: [
        {blackPlayerId: Meteor.userId()},
        {whitePlayerId: Meteor.userId()}
      ]},
    ];


    // add stuff relevant to 'yourMoveOnly'
    if (Session.get("YGyourMoveOnly")) {
      var add = [
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
      ];

      _.merge(and, add);
    }

    // add stuff relevant to 'timed'
    if (Session.get("YGisTimed")) {
      var add = [
        { timeUsed: { $exists: true } },
        { gameLength: { $exists: true } },
      ]
      _.merge(and, add);
    }

    return Games.find({ $and: and }, { sort: { lastActivityAt: -1 } });
  },
});
