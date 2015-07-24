Chatrooms = new Mongo.Collection('chatroom');

if(Meteor.isServer){
  Meteor.startup(function(){
    if(Chatrooms.find({}).length === 0 || Chatrooms.find().length === undefined){
      Chatrooms.insert({
        name : 'Global',
        messages : [],
        onlineUsers : []
      });
    }
  });
}

