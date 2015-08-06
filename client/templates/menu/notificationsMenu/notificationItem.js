Template.notificationItem.helpers({
  templateName: function() {
    if (this.courier === "yourTurn") return "yourTurnItem";
  }
});

Template.notificationItem.events({

  'click tr': function(e) {
    e.stopPropagation();

  }
});
