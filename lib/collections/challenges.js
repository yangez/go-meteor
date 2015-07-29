Challenges = new Mongo.Collection('challenges', {
  transform: function(doc) {
    // add Challenge functions
    var challenge = new Challenge(doc);
    return challenge;
  }
});
