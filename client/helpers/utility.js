var getUsername = function(color, game) {
    Meteor.call('findPlayer', game._id, color, function(error, user) {
      if(user)
        Session.set('player'+color+game._id, user.username);
    });
    return Session.get('player'+color+game._id);
  };
Template.registerHelper('getUsername', getUsername);
