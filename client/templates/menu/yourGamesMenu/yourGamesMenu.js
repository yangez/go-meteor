Template.yourGamesMenu.helpers({
  yourTurnCount: function() {

    var games = Games.find({ $and: [
        {archived: {$exists: false}}, // not archived

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
      ]
    });

    return games.count();


  },
});
