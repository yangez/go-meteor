Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { return Meteor.subscribe('games'); },

  // loading
  progressSpinner: false,
  progressTick : false,
  progressDelay: 50,
});

Router.route('/', { name: 'lobby'}); // index.html
Router.route('/:username', {
	onBeforeAction: function(){
		var username = this.params.username;
		Meteor.users.findOne({username : username}) === undefined ?
			this.render('notFound') : this.next();
	},
  name: 'userProfile',
  data: function() { return Meteor.users.findOne({ username : this.params.username }); }
});
Router.route('/:username/edit', {
  onBeforeAction: function(){
    !Meteor.user() || Meteor.user().username !== this.params.username ? this.render('accessDenied') : this.next();
  },
  action: function(){
    this.render();
  },
  name: 'editUserProfile',
  data: function() { return Meteor.users.findOne({ username : this.params.username }); }
});
Router.route('/games/:_id', {
  name: 'match', // show.html
  data: function() { return Games.findOne(this.params._id); },
});
// function requireLogin() {
//   if (! Meteor.user()) {
//     this.render('accessDenied');
//   } else {
//     this.next();
//   }
// }

Router.onBeforeAction('dataNotFound', { only: 'match' });
