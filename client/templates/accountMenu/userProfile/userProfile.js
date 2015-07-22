Template.userProfile.helpers({
  user : function(){
    return this;
  },

  games : function(){
    return findArchivedGames(this);
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

var findArchivedGames = function(user){
  return Games.find({ $and: [
        {archived: true},
        {$or: [ // player is in game
          {blackPlayerId: user._id},
          {whitePlayerId: user._id}
        ]}
      ] }, { sort: { lastActivityAt: -1 } });
}
