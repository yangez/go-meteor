Template.gamesList.helpers({
  games: function() {
    return Games.find();
  }
});

Template.gameItem.helpers({
  domain: function() {
    var a = document.createElement('a');
    a.href = this.url;
    return a.hostname;
  }
});
