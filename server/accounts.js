var accountConfig = {
  maxLength : 16,
  minLength : 3,
}
Object.freeze(accountConfig);

Accounts.onCreateUser(function(options, user) {
  if (options.profile){
    user.profile = options.profile;
    user.profile.displayName = {
      first : '',
      last : ''
    }
    user.profile.age = null;
    user.profile.location = "";
    user.profile.description = "";
  }
  return user;
});

Accounts.validateNewUser(function(user){
  var passedLength = false;
  var passedUsernameValidation = false;

  if(user && user.username.length >= accountConfig.minLength && user.username.length <= accountConfig.maxLength){
    passedLength = true;
  }

  if(user){
    var allUsers = Meteor.users.find({}).fetch();
    passedUsernameValidation = allUsers.every(function(userInArr){
      return userInArr.username.toLowerCase() !== user.username.toLowerCase();
    });
  }

  if(!passedLength)
    throw new Meteor.Error('Invalid username length', 'Username must be between 3 and 16 characters.');
  if(!passedUsernameValidation)
    throw new Meteor.Error('Username is taken', 'That username is taken. Please enter a different username.');

  if(passedLength && passedUsernameValidation) return true;
  else return false;
});
