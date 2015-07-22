Template.history.helpers({
  'username' : function(){
    return this.username;
  },

  'games' : function(){
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

  'heading' : function(){
    return this.username + "'s game history:"
  }
});

Template.history.events({

});
