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
