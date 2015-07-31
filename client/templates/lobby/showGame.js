Template.showGame.events({
  'click #board': function(e) {
    e.preventDefault(); e.stopPropagation();
    Router.go("match", {_id: this._id});
  },
});

Template.showGame.helpers({
  game: function() {
    return Games.findOne(this._id);
  }
});
