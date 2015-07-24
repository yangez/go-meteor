Template.onlineUsers.helpers({
	activeUsers : function(){
		var tempIdCheck = [];
		var uniqueOnlineUsers = [];
		var activeUsers = Presences.find({}).forEach(function(person){
			var id = person.userId;
			if(tempIdCheck.indexOf(id) === -1){
				tempIdCheck.push(id);
				uniqueOnlineUsers.push(person);
			}
		});

		return uniqueOnlineUsers;
	}
})

Template.onlineUsers.events({

})

