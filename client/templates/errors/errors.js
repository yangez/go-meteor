Template.errors.helpers({
  errors: function() {
    return Errors.find();
  }
});

Template.error.helpers({
  class: function() {
    return "alert-info";
  }
});

Template.error.onRendered(function() {
  var error = this.data;
  Meteor.setTimeout(function () {
    Errors.remove(error._id);
  }, 3000);
});
