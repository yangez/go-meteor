Chatrooms = new Mongo.Collection('chatroom');

if(Meteor.isServer){
  Meteor.startup(function(){
    if(Chatrooms.find({}).length === 0){
      Chatrooms.insert({
        name : 'Global',
        messages : [],
        onlineUsers : []
      });
    }
  });
}

