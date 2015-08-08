Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// local collection to display errors
Errors = new Mongo.Collection(null);

// Setup the state function on the client
Presence.state = function() {
  var routeName, obj = { online: true }

  if (Router.current()) {
    var routeName = Router.current().route.getName();
    obj = _.extend(obj, {
      currentRoute: routeName
    });

    if (routeName === "match") {
      obj = _.extend(obj, {
        currentGameId: Router.current().params._id,
      });
    }
  }
  return obj;
}
