Chatrooms = new Mongo.Collection('chatroom');

// note from Eric for future: I've been putting collection methods in lib/methods folder and namespaced for that collection. Look at Games for an example
Meteor.methods({
	postToGlobalChat : function(msgData){
		var globalChatId = Chatrooms.findOne({name: 'Global'})._id;
		Chatrooms.update({_id : globalChatId }, {$push : { messages : msgData}});
	}
});

if(Meteor.isServer){
  Meteor.startup(function(){
    if(Chatrooms.find({}).count() === 0){
      Chatrooms.insert({
        name : 'Global',
        messages : [],
        onlineUsers : []
      });
    }
  });
}
