Template.gamesList.helpers({
  games: function() {
    return Games.find();
  }
});

Template.gameItem.helpers({
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

Template.gameItem.events({
  'click tr': function(e) {
    e.preventDefault();

    Router.go('gamePage', { _id: this._id });
  },
  'click .join-game': function(e) {
    e.preventDefault();

    gameId = Games.update({_id: this._id}, {$set: { whitePlayerId: Meteor.userId() } } );
    Router.go('gamePage', { _id: this._id });

  }
});
