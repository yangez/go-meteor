Template.gamePage.helpers({
  messages: function(){
    return this.messages;
  }
});

Template.gamePage.events({
  'submit #comment-form': function(e) {
    e.preventDefault();

    messages = this.messages;

    if (!messages) messages = [];

    messages.push({
      author: Meteor.user().username,
      content: $(e.target).find('[name=content]').val(),
    });

    Games.update({_id: this._id}, {$set: {messages: messages}});

    $(e.target).find('[name=content]').val("");
  },
  'click #archive': function(e) {
    e.preventDefault();
    Games.update({_id: this._id}, {$set: {archived: true}});
    Router.go('gamesList');
  }
});


// board js
var wgoBoard;

Template.board.onRendered(function(e){
  wgoBoard = new ReactiveVar(
    new WGo.Board(document.getElementById("board"), {
      width: 600,
    })
  );

  var board = wgoBoard.get();

  var game = this.data;
  if (game.state) board.restoreState(game.state);

  var tool = document.getElementById("tool"); // get the <select> element


  board.addEventListener("click", function(x, y) {
    if(tool.value == "black") {
      board.addObject({
        x: x,
        y: y,
        c: WGo.B
      });
    }
    else if(tool.value == "white") {
      board.addObject({
        x: x,
        y: y,
        c: WGo.W
      });
    }
    else if(tool.value == "remove") {
      board.removeObjectsAt(x, y);
    }
    else {
      board.addObject({
        x: x,
        y: y,
        type: tool.value
      });
    }

    var state = board.getState();
    Games.update({_id: game._id }, { $set: { state: state } });

  });
});


Template.board.helpers({
  'restoreState' : function(){
    if (wgoBoard) var board = wgoBoard.get();
    var game = this;

    if (board && game && game.state) {
      board.restoreState(game.state);
    }
  }
});
