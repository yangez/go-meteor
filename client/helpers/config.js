Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

notify.config({pageVisibility: true, autoClose: 2500})

// local collection to display errors
Errors = new Mongo.Collection(null);
