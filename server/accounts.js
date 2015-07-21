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