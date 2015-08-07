Template.globalChat.onRendered(function(){
	$('.chat-messages').animate({scrollTop : 10000});
	Session.set('pm', false);
})

Template.globalChat.helpers({
	privateRooms: function(){
		// want to find the pms that the current logged-in user is in
		var usersPrivateChats = Rooms.find({
      $and: [
        { users : {$in : [Meteor.userId()]} },
        { type : 'pm' }
      ]
    }).fetch();

		usersPrivateChats.forEach(function(room) {
			var newName = room.name.split(',').filter(function(username) {
				return username !== Meteor.user().username;
			}).join('');
			room.name = newName;
		})

    return usersPrivateChats;
	},
	messages : function(){
		if(Session.get('pm')){
			var messages = Messages.find({ roomId: Session.get('pm')});
		}else{
			var room = Rooms.findOne({name: 'Global'});
			var messages = Messages.find({roomId: room._id}, {limit: 100});
		}
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
	},
	settings: function() {
		var presences = Presences.find().fetch();
		var onlineUsers = [];
		presences.filter(function(user) {
			if(onlineUsers.indexOf(user.userId) === -1){
				onlineUsers.push(user.userId);
				return true;
			} else {
				return false;
			}
		});

    return {
      position: Session.get("position"),
      limit: 3,
      rules: [
        {
          token: '@',
          collection: Meteor.users,
					filter: {_id: {$in: onlineUsers}},
          field: 'username',
          template: Template.globalChatAutoComplete
        }
      ]
    };
  }
});

Template.globalChat.events({
	'click #global-chat': function(e){
		e.preventDefault();
		Session.set('pm', false);
	},

	'click .pm': function(e){
		e.preventDefault();
		Session.set('pm', this._id);
	},

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
		    	input.val('');
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

		$('.chat-messages').animate({scrollTop : 10000});
	}
});
