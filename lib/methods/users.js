Meteor.methods({
  // autocomplete function for challenge username
  'user/autocomplete': function(query, options) {
    options = options || {};

    // guard against client-side DOS: hard limit to 50
    if (options.limit) {
      options.limit = Math.min(50, Math.abs(options.limit));
    } else {
      options.limit = 50;
    }

    var regex = new RegExp("^" + query);
    return Meteor.users.find({username: {$regex:  regex}}, options).fetch();
  }
});
