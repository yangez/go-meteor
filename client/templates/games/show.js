Template.gamePage.helpers({
  white: function() {
    var id = this._id;
    Meteor.call('findPlayer', id, "white", function(error, user) {
      if(user)
        Session.set('whiteplayer'+ id, user.username);
    });
    return Session.get('whiteplayer'+id);
  },
  black: function() {
    var id = this._id;
    Meteor.call('findPlayer', id, "black", function(error, user) {
      if(user)
        Session.set('blackplayer'+ id, user.username);
    });
    return Session.get('blackplayer'+id);
  }
});

