Template.globalChat.onRendered(function(){
	$('.chat-messages').animate({scrollTop : 500});

})

Template.globalChat.helpers({
	messages : function(){
		$('.chat-messages').animate({scrollTop : 500});
		return this.messages;
	}
});

Template.globalChat.events({
	'submit #chat-form-submit' : function(e){
		e.preventDefault();
		if(!Meteor.user()){
			$("#enter-message-text").val('Please sign in at the top right corner. Thank you!');
			return;
		}
		var globalChatId = Chatrooms.find({name: 'Global'})._id;
		var timestamp = moment().format("hh:mm");
		var text = $("#enter-message-text").val();
		var msgData = {
			user : Meteor.user().username,
			time : timestamp,
			text : text.trim()
		}
		Meteor.call('postToGlobalChat', msgData);
		$("#enter-message-text").val('');
	}
});