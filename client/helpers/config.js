Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});

notify.config({pageVisibility: true, autoClose: 2500})

// local collection to display errors
Errors = new Mongo.Collection(null);

showMessage = function(message, type) {
  Errors.insert({message: message});
};
