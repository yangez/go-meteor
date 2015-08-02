Rooms = new Mongo.Collection('rooms', {
  transform: function(doc) {
    // add Challenge functions
    var room = new Room(doc);
    return room;
  }
});

Meteor.methods({

});
