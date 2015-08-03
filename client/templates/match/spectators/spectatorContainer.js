Template.spectatorsContainer.onRendered(function(){
  $('[data-toggle="tooltip"]').tooltip();
});

Template.spectatorContainer.helpers({
  spectators: function() {
    var game = this.game._id;
    var presences = Presences.find({"state.currentGameId": gameId}).fetch();
    var uniqueUserIds = [];

    presences.forEach(function (p) {
      if (uniqueUserIds.indexOf(p.userId) > -1) {
        uniqueUserIds.push(p.userId);
      }
    });

    return uniqueUserIds;
  }
});

Template.spectatorContainer.events({
  'mouseenter .spectators-container': function(e) {

  },
  'mouseleave .spectators-container': function(e) {
    console.log('mouseleave');
  }
});
