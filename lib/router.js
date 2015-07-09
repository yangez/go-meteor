Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { return Meteor.subscribe('games'); }
});

Router.route('/', { name: 'gamesList'});
Router.route('/new', { name: 'gameNew'});

var requireLogin = function() {
  if (! Meteor.user()) {
    this.render('accessDenied');
  } else {
    this.next();
  }
}

Router.onBeforeAction(requireLogin, { only: 'gameNew' });
