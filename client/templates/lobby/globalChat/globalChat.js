Template.globalChat.onRendered(function(){
	$('.chat-messages').animate({scrollTop : 2040});
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
			var offset = Messages.find({roomId: room._id}).count() - 100;
			if (offset < 0) {
				var offset = 0;
			}
			var messages = Messages.find({roomId: room._id}, {limit: 100, skip: offset});
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
		Meteor.call('user/msg', text, Session.get('pm'), function(err, result){
			if(!err) input.val('');
		});

		$('.chat-messages').animate({scrollTop : $('.chat-messages')[0].scrollHeight - $('.chat-messages').height()});
	}
});
