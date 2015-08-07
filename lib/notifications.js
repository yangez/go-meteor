/* Your Turn notification */
Herald.addCourier('yourTurn', {
  media: {
    onsite: {} //Send notifications to client, with no custom configuration
  },

  data: function () { return this.data; }
});

Herald.addCourier('challengeNew', {
  media: { onsite: {} },

  data: function() { return this.data; }

});

Herald.addCourier('challengeAccepted', {
  media: { onsite: {} },

  data: function() { return this.data; }

});

Herald.addCourier('challengeDeclined', {
  media: { onsite: {} },

  data: function() { return this.data; }

});
