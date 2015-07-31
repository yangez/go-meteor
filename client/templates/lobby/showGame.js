Template.showGame.events({
  'click #board': function(e) {
    e.preventDefault(); e.stopPropagation();
    Router.go("match", {_id: this._id});

  }
});
