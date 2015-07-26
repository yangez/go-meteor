Messages = new Mongo.Collection('message');
Meteor.methods({
  postToGlobalChat : function(user, text){
    Messages.insert({
      from : user._id,
      text : text,
      time : moment().format(),
      to : 'Global',
    });
  },

  privateMessage : function(sender, command){
    var sendeeName = command.split(' ')[1];
    var sendee = Meteor.users.findOne({username : sendeeName});

    if(!sendee)
      throw new Meteor.Error("Invalid username", "Invalid whisper target username.");

    if(sendee){
      var text = command.split(' ').slice(2).join(' ');
      var msg = {
        from : sender._id,
        text : text,
        time : moment().format(),
        to : sendee._id
      }
      return Messages.insert(msg);
    }
  }
});
