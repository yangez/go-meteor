// Real name, age, email, location
Template.userProfile.helpers({
  username : function(){
    return this.username;
  },

  firstname : function(){
    return this.profile.displayName.first;
  },

  lastname : function(){
    return this.profile.displayName.last;
  },

  age : function(){
    return this.profile.age;
  },

  location : function(){
    return this.profile.location;
  },

  description : function(){
    return this.profile.description;
  }
});

Template.userProfile.events({
  'submit #profile-form' : function(e){
    e.preventDefault();
    var data = {
      firstname : $(e.target).find('[name=firstname]').val(),
      lastname : $(e.target).find('[name=lastname]').val(),
      age : $(e.target).find('[name=age]').val(),
      location : $(e.target).find('[name=location]').val(),
      description : $(e.target).find('[name=description]').val()
    }

    Meteor.users.update({_id:Meteor.userId()}, {$set : {
      "profile.displayName.first" : data.firstname,
      "profile.displayName.last" : data.lastname,
      "profile.age" : data.age,
      "profile.location" : data.location,
      "profile.description" : data.description
    }});
  },

  'click #profile-reset-button': function(e){
    e.preventDefault();
    $('#firstname').val(this.profile.displayName.first);
    $('#lastname').val(this.profile.displayName.last);
    $('#age').val(this.profile.age);
    $('#location').val(this.profile.location);
    $('#description').val(this.profile.description);
  }
});
