Messages = new Mongo.Collection('message');
Meteor.methods({
  postToGlobalChat : function(user, text){
    Messages.insert({
      user : user._id,
      text : text,
      time : moment().format(),
      room : 'Global',
      pm : false,
      pmTo : null
    });
  }
});
