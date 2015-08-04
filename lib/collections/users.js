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
  updateMeta: function(obj, metaType) {
    var set = {};

    if (!metaType) var metaType = "meta";

    _.forOwn(obj, function(value, key) {
      set[metaType+"."+key] = value;
    });

    if (metaType !== "meta") {
      set = {meta: set};
    }

    console.log(set);
    // Messages.update({_id: this._id}, {$set: set });
  },
});
