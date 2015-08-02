Template.globalChat.onRendered(function(){
	$('.chat-messages').animate({scrollTop : 10000});
})

Template.globalChat.helpers({
	messages : function(){
		var room = Rooms.findOne({name: 'Global'});
		messages = Messages.find({roomId: room._id}, {limit: 100});

		return messages;
	},
	time: function() {
		return moment(this.createdAt).format("hh:mm:ss");
	},
	user: function() {
		var user = Meteor.users.findOne(this.senderId);
		return user.username;
	},
	text: function() {
		return this.content;
	}
});

Template.globalChat.events({
	'submit #chat-form-submit' : function(e){
		e.preventDefault();
		if(!Meteor.user()){
			$("#enter-message-text").val('Please sign in at the top right corner. Thank you!');
			return;
		}

		var globalChatId = Rooms.findOne({name: 'Global'})._id;
		var text = $("#enter-message-text").val();

		if (text.trim().length) {
			Meteor.call('rooms/addMessage', globalChatId, text);
			$("#enter-message-text").val('');
		}
	}
});
