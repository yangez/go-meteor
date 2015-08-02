Template.onlineUsers.helpers({
	activeUsers : function(){
		var presences = Presences.find({}).fetch();
		var temp = [];
		return presences.filter(function(user){ // filter out duplicate users
			if(temp.indexOf(user.userId) === -1){
				temp.push(user.userId);
				return true;
			}
			return false;
		});
	}
})

Template.onlineUsers.events({

})

