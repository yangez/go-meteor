Template._loginButtonsLoggedInDropdown.events({
  'click #login-buttons-edit-profile': function(e) {
    Router.go('userProfile', { _id : Meteor.userId() });
  },
  'click #login-buttons-view-history': function(e){
    Router.go('history', { _id : Meteor.userId() });
  }
});
