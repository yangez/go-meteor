/* Your Turn notification */
Herald.addCourier('yourTurn', {
  media: {
    onsite: {} //Send notifications to client, with no custom configuration
  },

  //will be a function on the collection instance, returned from find()
  message: function () {
    return 'It is your turn: "' + this.data.post.name + '"';
  }
});
