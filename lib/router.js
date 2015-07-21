
Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { return Meteor.subscribe('games'); }
});

Router.route('/', { name: 'lobby'}); // index.html
Router.route('/games/:_id', {
  name: 'gamePage', // show.html
  data: function() { return Games.findOne(this.params._id); }
});

var requireLogin = function() {
  if (! Meteor.user()) {
    this.render('accessDenied');
  } else {
    this.next();
  }
}

Router.onBeforeAction('dataNotFound', { only: 'gamePage' });
Router.onBeforeAction(requireLogin, { only: 'createGame' });
