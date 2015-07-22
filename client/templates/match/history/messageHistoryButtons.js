Template.messageHistoryButtons.onCreated(function(){
  if (!Session.get("messageHistoryState")) {
    Session.set("messageHistoryState", "live");
  }
});

Template.messageHistoryButtons.onDestroyed(function(){
  // remove session after it's destroyed
  Session.set("messageHistoryState", undefined);
})

Template.messageHistoryButtons.helpers({
  buttonLiveActive: function() {
    return Session.get("messageHistoryState") === "live";
  },
  buttonInGameActive: function() {
    return Session.get("messageHistoryState") === "ingame";
  },
});

Template.messageHistoryButtons.events({
  'click #chat-live': function(e) {
    e.stopPropagation();
    Session.set("messageHistoryState", "live");
  },
  'click #chat-ingame': function(e) {
    e.stopPropagation();
    Session.set("messageHistoryState", "ingame");
    scrollInGameMessages(0);
  },
});
