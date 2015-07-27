defaultFilters = {
  color: 'all',
  winLoss : 'all',
  boardSize : 'all',
  outcome : 'all',
  user : '',
  pending : 'archived',
}

filterValToIndex = {
  color: {
    all: 0,
    black: 1,
    white: 2,
  },

  winLoss: {
    all: 0,
    win: 1,
    loss: 2,
  },

  boardSize: {
    all: 0,
    9: 1,
    13 : 2,
    19 : 3,
  },

  outcome: {
    all: 0,
    resign: 1,
    small: 2,
    medium: 3,
    big: 4,
  },

  pending: {
    archived: 0,
    open: 0,
  }
}

Template.filtering.onRendered(function(){
  if(!Session.get('gameFilters')){
    Session.set('gameFilters', _.clone(defaultFilters));
  }else{
    // set the select option stuff up
    $('#color-filter').prop('selectedIndex', filterValToIndex['color'][Session.get('gameFilters').color]);
    $('#win-loss-filter').prop('selectedIndex', filterValToIndex['winLoss'][Session.get('gameFilters').winLoss]);
    $('#board-size-filter').prop('selectedIndex', filterValToIndex['boardSize'][Session.get('gameFilters').boardSize]);
    $('#outcome-filter').prop('selectedIndex', filterValToIndex['outcome'][Session.get('gameFilters').outcome]);
    $('#pending-filter').prop('selectedIndex', filterValToIndex['pending'][Session.get('gameFilters').pending]);
    $('#user-filter').val(Session.get('gameFilters').user);
  }
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

  'keyup #user-filter' : function(e){
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
