Template.typeahead.onRendered(function(){
  Meteor.typeahead.inject();
});


Template.typeahead.helpers({
  search: function(query, sync, callback)  {
    Meteor.call('user/autocomplete', query, {}, function(err, res) {
      if (err) return console.log(err);

      callback(res.map(function(v){ return {value: v.username}; }));
    });
  },
})
