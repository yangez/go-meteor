Template.match.helpers({
  defaultNotify: function() {
    if (
      this.isReady() &&
      !Session.get("requestedNotification") &&
      this.hasPlayerId(Meteor.userId())
    ) return Notification.permission === "default";

  }
});

Template.match.events({
  'click #notify-permissions': function(e) {
    e.preventDefault();

    if (this.hasPlayerId(Meteor.userId())) {
      if (Notification.permission === "default") {
        Notification.requestPermission(function(){
          Session.set("requestedNotification", true);
        });
      }
    }
  }
})
