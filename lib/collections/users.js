Meteor.users.allow({
  update: function(userId) {
    if (userId) return true;
  }
})