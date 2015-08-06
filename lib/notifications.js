/* Your Turn notification */
Herald.addCourier('yourTurn', {
  media: {
    onsite: {} //Send notifications to client, with no custom configuration
  },

  //will be a function on the collection instance, returned from find()
  data: function () {
    return this.data;
  }
});
