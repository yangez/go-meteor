Template.globalChat.onRendered(function(){
	$('.chat-messages').animate({scrollTop : 10000});
})

Template.globalChat.helpers({
	messages : function(){
		$('.chat-messages').animate({scrollTop : 10000});
		return this;
	},

	username : function(){
		return Meteor.users.findOne({_id : this.from }).username;
	},

	displayTime : function(){
		return moment(this.time).format('hh:mm');
	}
});

Template.globalChat.events({
	'submit #chat-form-submit' : function(e){
		var input = $(e.target).find('[name=message]');
		e.preventDefault();
		if(!Meteor.user()){
			input.val('Please sign in at the top right corner. Thank you!');
			return;
		}

		var text = input.val();

		if(text.slice(0,2) === '/w'){
			Meteor.call('privateMessage', Meteor.user(), text, function(err, results){
				if(err) showMessage("Please enter a valid username to whisper to.");
				input.val('');
			})
		}else{
			Meteor.call('postToGlobalChat', Meteor.user(), text.trim());
			input.val('');
		}
	}
});
