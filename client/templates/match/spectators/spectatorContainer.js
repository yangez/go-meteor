Template.spectatorContainer.onRendered(function(){
  $('.spectators-container').popover({
    placement: 'right',
    trigger: 'click',
    content: Blaze.toHTMLWithData(Template.spectator, {gameData: Template.currentData()}),
    container: 'body',
    html: true
  });
});

Template.spectatorContainer.helpers({

});
