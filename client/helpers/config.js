Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

notify.config({pageVisibility: true, autoClose: 2500})

// local collection to display errors
Errors = new Mongo.Collection(null);

// Setup the state function on the client
Presence.state = function() {
  var routeName = Router.current().route.getName();
  var obj = {
    online: true,
    currentRoute: routeName
  };

  if ( routeName === "match") {
    obj = _.extend(obj, {
      currentGameId: Router.current().params._id,
    })
  }
  return obj;
}
