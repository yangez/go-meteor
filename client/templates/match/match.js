Template.match.helpers({
  defaultNotify: function() {
    if (
      this.isReady() &&
      !Session.get("requestedNotification") &&
      this.hasPlayer(Meteor.user())
    ) return notify.permissionLevel() === notify.PERMISSION_DEFAULT;

  }
});

Template.match.events({
  'click #notify-permissions': function(e) {
    e.preventDefault();

    if (this.hasPlayer(Meteor.user())) {
      if (notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
        notify.requestPermission(function(){
          Session.set("requestedNotification", true);
        });
      }
    }
  }
})
