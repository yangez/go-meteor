// DANGER: this allows anyone to update any other user. Remove this asap, especially before release
Meteor.users.allow({
  update: function(userId) {
    if (userId) return true;
  }
})


/*
# User
- emails: []
- profile: { age, description, displayName={}, location }
- username
- meta: {
  notifications: { }
}
*/

Meteor.users.helpers({

  createNotification: function(gameId, type) {
    if (notify.permissionLevel() !== notify.PERMISSION_GRANTED) return false;

    var game = Games.findOne(gameId);
    if (!game) throw new Meteor.Error("Game does not exist.");

    if (game.isCurrentPlayerMove()) {
      var opponent = game.getOpponent();
      var color = game.getColorOfPlayerId(this._id);

      notify.createNotification("Your move", {
        body: "It's your turn to move in your "+game.size+"x"+game.size+" game as "+color+" against "+opponent.username+".",
        icon: "/chat.ico"
      });

      this.updateMeta("notifications", {
      });

    }

  },


  // private

  updateMeta: function(type, obj) {
    var meta = this.meta ? this.meta : {};
    meta[type] = meta[type] ? meta[type] : {};

    _.forOwn(obj, function(value, key) {
      meta[type][key] = value;
    });

    var set = { "meta": meta };

    Meteor.users.update({_id: this._id}, {$set: set });
  },
});
