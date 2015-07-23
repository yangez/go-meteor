Template.createGame.events({
  'submit form': function(e) {
    e.preventDefault();

    var game = {
      size: $(e.target).find('[name=size] option:selected').val(),
      color: $(e.target).find('[name=color]:checked').val()
    }

    Meteor.call('game/insert', game, function(error, result) {
      if (error) return console.log(error.message);
      Router.go('match', { _id: result._id });
    });
  }
});
