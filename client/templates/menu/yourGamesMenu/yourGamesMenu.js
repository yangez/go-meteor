Template.yourGamesMenu.helpers({
  yourTurnCount: function() {

    var and = [
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
            {turn: 1 }
          ]},
          {$and:[
            {whitePlayerId: Meteor.userId()},
            {turn: -1 }
          ]},
        ]},

      ]}
    ];

    var currentRouteName = Router.current().route.getName();
    if (currentRouteName === "match") {
      var notCurrentGame = { _id: { $ne: Router.current().params._id } };
      and.push(notCurrentGame);
    }

    var games = Games.find({ $and: and });
    return games.count();


  },
});
