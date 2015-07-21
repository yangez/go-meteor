Template.createGame.events({
  'submit form': function(e) {
    e.preventDefault();

    var game = {
      size: $(e.target).find('[name=size] option:selected').val(),
      color: $(e.target).find('[name=color]:checked').val()
    }

    Meteor.call('gameInsert', game, function(error, result) {
      // display error and abort
      if (error)
        return alert(error.reason);

      Router.go('match', { _id: result._id });

    });
  }
});
