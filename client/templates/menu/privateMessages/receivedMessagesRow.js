Template.receivedMessagesRow.helpers({
  // username: function() {
  //   var user = Meteor.users.findOne(this.recipientId);
  //   if (user) return user.username;
  // },
  roomname: function() {
    return this.name
  }
});

Template.receivedMessagesRow.events({
  'click .challenge-cancel': function(e) {
    e.stopPropagation();
    Meteor.call("challenge/cancel", this._id, function(e, r) {
      if (e) return console.log(e.message);
    })
  },
  'click .challenge-acknowledge': function(e) {
    Meteor.call("challenge/acknowledge", this._id, function(e, r) {
      if (e) return console.log(e.message);
      Router.go("match", { _id: r.gameId });
    })
  }
});
