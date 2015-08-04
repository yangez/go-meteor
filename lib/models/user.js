/*
# User
- emails: []
- profile: { age, description, displayName={}, location }
- username
- meta: {
  notifications: { }
}
*/

User = function(doc) {
  _.extend(this, doc);
};

_.extend(User.prototype, {

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
