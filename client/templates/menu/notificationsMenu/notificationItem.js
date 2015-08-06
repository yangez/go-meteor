Template.notificationItem.events({
  'click tr': function() {
    var user = Meteor.user();
    user.readNotification(this._id);
  }
});
