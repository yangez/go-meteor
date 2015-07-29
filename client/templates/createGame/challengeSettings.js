
Template.challengeSettings.events({
  'change #enable-challenge': function(e) {
    element = e.target;
    Session.set("challengeEnabled", element.checked);
  },
});


Template.challengeSettings.helpers({
  challengeEnabled: function() {
    return Session.get("challengeEnabled");
  },

});
