Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
  waitOn: function() { return Meteor.subscribe('yourActiveGames'); },

  // loading
  progressSpinner: false,
  progressDelay: 100,
  progress: false,
});

Router.route('/', {
  name: 'lobby',
  progress: true,
  subscriptions: function() {
    return Meteor.subscribe('latestGames');
  },
  onBeforeAction: function() {
    if (this.params.query.challenges === 'open') {
      Session.set("challengeMenuOpen", true);
      this.redirect("lobby");
    } else this.next();
  },
}); // index.html
Router.route('/:username', {
  subscriptions: function() {
    return Meteor.subscribe('gamesOfUser', this.params.username);
  },
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
  subscriptions: function() { return Meteor.subscribe('specificGame', this.params._id) },
  data: function() { return Games.findOne(this.params._id); },
  progress: true
});
// function requireLogin() {
//   if (! Meteor.user()) {
//     this.render('accessDenied');
//   } else {
//     this.next();
//   }
// }

Router.onBeforeAction('dataNotFound', { only: 'match' });
