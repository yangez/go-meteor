Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { return Meteor.subscribe('games'); }
});

Router.route('/', { name: 'lobby'}); // index.html
Router.route('/games/:_id', {
  name: 'match', // show.html
  data: function() { return Games.findOne(this.params._id); }
});
Router.route('/:username', {
  name: 'userProfile',
  data: function() { return Meteor.users.findOne({ username : this.params.username }); }
});
Router.route('/:username/edit', {
  name: 'editUserProfile',
  data: function() { return Meteor.users.findOne({ username : this.params.username }); }
});
var requireLogin = function() {
  if (! Meteor.user()) {
    this.render('accessDenied');
  } else {
    this.next();
  }
}

Router.onBeforeAction('dataNotFound', { only: 'match' });
