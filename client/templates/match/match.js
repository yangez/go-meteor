Template.match.helpers({
  defaultNotify: function() {
    if (
      this.isReady() &&
      !Session.get("requestedNotification") &&
      this.hasPlayerId(Meteor.userId())
    ) return notify.permissionLevel() === notify.PERMISSION_DEFAULT;

  }
});

Template.match.events({
  'click #notify-permissions': function(e) {
    e.preventDefault();

    if (this.hasPlayerId(Meteor.userId())) {
      if (notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
        notify.requestPermission(function(){
          Session.set("requestedNotification", true);
        });
      }
    }
  }
})
