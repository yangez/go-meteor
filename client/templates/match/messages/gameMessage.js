Template.gameMessage.helpers({
  isSystem: function() {
    return this.meta.type === "system";
  },
  username: function() {
    var user = Meteor.users.findOne(this.senderId);
    if (user) return user.username;
  }
});
