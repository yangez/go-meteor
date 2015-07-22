Template._loginButtonsLoggedInDropdown.events({
  'click #login-buttons-view-profile': function(e) {
    Router.go('userProfile', { username : Meteor.user().username });
  },
});
