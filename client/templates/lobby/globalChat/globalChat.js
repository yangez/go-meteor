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
		var input = $(e.target).find('[name=message]')
		e.preventDefault();
		if(!Meteor.user()){
			input.val('Please sign in at the top right corner. Thank you!');
			return;
		}

		var text = input.val();
		if(text.slice(0,2) === '/w') {
			var splitted = text.split(' ');
			var sendeeName = splitted[1];
			var message = splitted.slice(2).join(' ');

			var sendee = Meteor.users.findOne({username : sendeeName});
			if(!sendee) {
				console.log("Invalid username");
			} else {
				var privateRoom = Rooms.findOne({ 
		      $and: [
		        { users : {$in : [Meteor.userId()]} },
		        { users : {$in : [sendee._id]} },
		        { type : 'pm' }
		      ]
		    });
		    

		    if(!privateRoom) {
		    	var roomName = [Meteor.user().username, sendee.username].sort().join(',');
		    	var roomId = Meteor.call('rooms/create', {
		    		name : roomName,
		    		users : [Meteor.userId(), sendee._id],
		    		type : 'pm'
		    	}, function(err, newRoomId) {
		    		console.log(newRoomId);
		    		Meteor.call('rooms/addMessage', newRoomId, message);		
		    	});
		    } else {
		    	var roomId = privateRoom._id;
		    	Meteor.call('rooms/addMessage', roomId, message);
		    }
			}
		} else {
			var globalChatId = Rooms.findOne({name: 'Global'})._id;
			var text = input.val();

			if (text.trim().length) {
				Meteor.call('rooms/addMessage', globalChatId, text);
				input.val('');
			}
		}
	}
});
