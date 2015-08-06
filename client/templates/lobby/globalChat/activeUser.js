Template.activeUser.helpers({
	'user' : function(){
		return Meteor.users.findOne({_id : this.userId});
	}
})

Template.activeUser.events({
	'click .online-user' : function(e){
		var selectedUser = Meteor.users.findOne({_id : this.userId});
		Router.go('userProfile', { username : selectedUser.username });
	}
})
