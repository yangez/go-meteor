defaultFilters = {
  color: 'all',
  winLoss : 'all',
  boardSize : 'all'
  // outcome : 'all'
}

Template.filtering.onRendered(function(){
  Session.set('historyFilters', defaultFilters);
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
  }
});

function filterEventHandler(e, property){
  e.preventDefault();
  var setting = $(e.target).find('option:selected').val();
  var newFilters = _.clone(Session.get('historyFilters'));
  
  newFilters[property] = setting;
  Session.set('historyFilters', newFilters);
}
