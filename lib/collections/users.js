// Meteor.users._transform = function(doc){
//   return doc;
// }

// DANGER: this allows anyone to update any other user. Remove this asap, especially before release
Meteor.users.allow({
  update: function(userId) {
    if (userId) return true;
  }
})
