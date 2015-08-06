/* Your Turn notification */
Herald.addCourier('yourTurn', {
  media: {
    onsite: {} //Send notifications to client, with no custom configuration
  },

  //will be a function on the collection instance, returned from find()
  message: function () {
    return "It's your turn in "+this.data.size+" game as "+this.data.color+" against "+this.data.opponent+".";
  }
});
