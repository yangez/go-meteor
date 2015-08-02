Rooms = new Mongo.Collection('rooms');

// note from Eric for future: I've been putting collection methods in lib/methods folder and namespaced for that collection. Look at Games for an example
Meteor.methods({
	postToGlobalChat : function(msgData){
		var globalChatId = Rooms.findOne({name: 'Global'})._id;
		Rooms.update({_id : globalChatId }, {$push : { messages : msgData}});
	}
});

if(Meteor.isServer){
  Meteor.startup(function(){
    if(Rooms.find({}).count() === 0){
      Rooms.insert({
        name : 'Global',
        messages : [],
        onlineUsers : []
      });
    }
  });
}
