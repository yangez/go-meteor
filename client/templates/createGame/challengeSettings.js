
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

  search: function(query, sync, callback)  {
    Meteor.call('users/autocomplete', query, {}, function(err, res) {
      if (err) return console.log(err);

      console.log(query);
      callback(res.map(function(v){ return {value: v.username}; }));
    });
  },
});
