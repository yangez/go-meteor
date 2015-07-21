Template._loginButtonsLoggedInDropdown.events({
  'click #login-buttons-edit-profile': function(e) {
    Router.go('userProfile', { _id : Meteor.userId() });
  },
});