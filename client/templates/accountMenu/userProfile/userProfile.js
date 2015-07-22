Template.userProfile.helpers({
  user : function(){
    return this;
  },

  games : function(){
    return findArchivedGames();
  }
});
Template.userProfile.events({

});







var findArchivedGames = function(){
  return Games.find({ $and: [
        {archived: true},
        {$or: [ // player is in game
          {blackPlayerId: Meteor.userId()},
          {whitePlayerId: Meteor.userId()}
        ]}
      ] }, { sort: { lastActivityAt: -1 } });
}
