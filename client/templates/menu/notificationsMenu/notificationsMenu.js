Template.notificationsMenu.onRendered(function(){
  this.autorun(function() {
    if (Session.get("challengeMenuOpen")) {
      $("#notifications-menu").dropdown("toggle");
      Session.set("challengeMenuOpen", undefined);
    }
  })
});

Template.notificationsMenu.helpers({
  notifications: function() {
    return Herald.getNotifications({medium: 'onsite'});
  },
});

Template.notificationsMenu.events({
  'click .mark-read': function() {
    // mark all notifications as read
    Meteor.call("heraldMarkAllAsRead");
  }
});
