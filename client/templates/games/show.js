
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
  }
});


// board js

Template.board.helpers({
  'restoreState' : function(){
    var obj = Session.get('state'+this._id);

    console.log(obj);

    if (obj.state) {
      console.log(obj.board);
      obj.board.restoreState(obj.state);
    }
  }
});

Template.board.onRendered(function(e){
  var board = new WGo.Board(document.getElementById("board"), {
    width: 600,
  });

  var game = this;


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
    Games.update({_id: game.data._id }, { $set: { state: state } });
    Session.set('state'+game.data._id, {state: state, board: board});

  });
});

// Template.board.events({
//   'click' : function(e)


// });



