// DANGER: this allows anyone to update any other user. Remove this asap, especially before release
Meteor.users.allow({
  update: function(userId) {
    if (userId) return true;
  }
})


/*
# User
- emails: []
- profile: { age, description, displayName={}, location }
- username
- meta: {
  notifications: { }
}
*/

Meteor.users.helpers({

  updateMeta: function(obj) {
    var set = {};

    _.forOwn(obj, function(value, key) {
      set["meta."+key] = value;
    });

    Meteor.users.update({_id: this._id}, {$set: set });
  },
});
