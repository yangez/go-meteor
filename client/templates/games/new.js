Template.gameNew.events({
  'submit form': function(e) {
    e.preventDefault();

    var game = {
      url: $(e.target).find('[name=url]').val(),
      title: $(e.target).find('[name=title]').val()
    }

    Meteor.call('postInsert', post, function(error, result) {
      // display error and abort
      if (error)
        return alert(error.reason);

      if (result.postExists)
       alert('This link has already been posted');

      Router.go('postPage', { _id: result._id });

    });
  }
});
