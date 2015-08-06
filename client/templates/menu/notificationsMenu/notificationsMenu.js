Template.notificationsMenu.helpers({
  notifications: function() {
    return Herald.getNotifications({medium: 'onsite'});
  },
});
