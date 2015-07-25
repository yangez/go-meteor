defaultFilters = {
  color: 'all',
  winLoss : 'all',
  boardSize : 'all',
  outcome : 'all',
  user : 'all',
  pending : 'archived',
}

Template.filtering.onRendered(function(){
  Session.set('gameFilters', defaultFilters);
})

Template.filtering.helpers({

});

Template.filtering.events({
  'change #color-filter' : function(e){
    filterEventHandler(e, 'color');
  },

  'change #win-loss-filter' : function(e){
    filterEventHandler(e, 'winLoss');
  },

  'change #board-size-filter' : function(e){
    filterEventHandler(e, 'boardSize');
  },

  'change #outcome-filter' : function(e){
    filterEventHandler(e, 'outcome');
  },

  'change #pending-filter' : function(e){
    filterEventHandler(e, 'pending');
  },

  'change #user-filter' : function(e){
    e.preventDefault();
    var setting = $(e.target).val();
    var newFilters = _.clone(Session.get('gameFilters'));
    newFilters['user'] = setting;
    Session.set('gameFilters', newFilters);
  },
});

function filterEventHandler(e, property){
  e.preventDefault();
  var setting = $(e.target).find('option:selected').val();
  var newFilters = _.clone(Session.get('gameFilters'));

  newFilters[property] = setting;
  Session.set('gameFilters', newFilters);
}
