Template.filtering.onRendered(function(){
  console.log('ive been rendered bitch!');
})

Template.filtering.helpers({

});

Template.filtering.events({
  'change #win-loss-filter' : function(e){
    console.log('TRIGGER EVENT')
    e.preventDefault();
    var val = $(e.target).find('option:selected').val();
    console.log(val);
  },
});