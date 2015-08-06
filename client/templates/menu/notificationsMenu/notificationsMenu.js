Template.notifications.helpers({
  notifications: function() {
    Herald.getNotifications({medium: 'onsite'});
  },
});
