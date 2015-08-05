Template.spectatorsIcon.onRendered(function(){
  $('.fa-eye').popover({
    placement: 'right',
    trigger: 'click',
    content: ' ',
    container: 'body',
    html: true
  });
});

Template.spectatorsIcon.events({
  'shown.bs.popover': function(event, template) {
    $('.list-unstyled').remove();
    Blaze.renderWithData(Template.spectator, {gameData: Template.currentData()}, $('.popover-content')[0]);
  }
});
