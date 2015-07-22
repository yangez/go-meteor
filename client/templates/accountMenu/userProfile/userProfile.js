Template.userProfile.helpers({
  user : function(){
    return this;
  },

  games : function(){
    return findArchivedGames();
  },

  isUser : function(){
    return this._id === Meteor.userId();
  }
});


Template.userProfile.events({
  'click #profile-edit' : function(e){
    e.preventDefault();
    Router.go('editUserProfile', { username : Meteor.user().username });
  }
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
