Template.spectatorContainer.onRendered(function(){
  // var popoverTemplate = ['<div class="spectators-container popover">',
  //                               '<div class="arrow"></div>',
  //                               '<div class="popover-content">',
  //                               '</div>',
  //                           '</div>'].join('');

  $('.spectators-container').popover({
    placement: 'right',
    trigger: 'click',
    content: Blaze.toHTMLWithData(Template.spectator, {gameData: Template.currentData()}),
    container: 'body',
    html: true,
    // template: popoverTemplate
  });
});

Template.spectatorContainer.helpers({

});
