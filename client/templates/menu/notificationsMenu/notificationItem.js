Template.notificationItem.helpers({
  templateName: function() {
    if (this.courier === "yourTurn") return "yourTurnItem";
    
    else if (this.courier === "challengeNew") return "challengeNewItem";
    else if (this.courier === "challengeAccepted") return "challengeAcceptedItem";
    else if (this.courier === "challengeDeclined") return "challengeDeclinedItem";
  }
});

Template.notificationItem.events({

  'click tr': function(e) {
    // e.stopPropagation();

  }
});
