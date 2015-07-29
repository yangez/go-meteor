Template.timerSettings.onRendered(function(){
  // default should be timed
  Session.set("mainTimeEnabled", true);
})

Template.timerSettings.events({

  'click #time-type-display': function(e) {
    e.preventDefault();
    $type = $("#time-type");
    if ( $type.val() === "minutes" ) {
      $type.val("hours");
      $("#time-control").val(2);
      $("#time-type-display").html("hours");
    } else if ($type.val() === "hours") {
      $type.val("minutes");
      $("#time-control").val(30);
      $("#time-type-display").html("minutes");
    }
  },
  'click #by-time-type-display': function(e) {
    e.preventDefault();
    $type = $("#by-time-type");
    if ( $type.val() === "minutes" ) {
      $type.val("seconds");
      $("#by-time").val(30);
      $("#by-time-type-display").html("secs");
    } else if ($type.val() === "seconds") {
      $type.val("minutes");
      $("#by-time").val(1);
      $("#by-time-type-display").html("mins");
    }
  },

  'change #enable-main-time': function(e) {
    element = e.target;
    Session.set("mainTimeEnabled", element.checked);
  },

  'change #enable-byoyomi': function(e) {
    element = e.target;
    Session.set("byoyomiEnabled", element.checked);
  },

});


Template.timerSettings.helpers({
  mainTimeEnabled: function() {
    return Session.get("mainTimeEnabled");
  },
  byoyomiEnabled: function() {
    return Session.get("byoyomiEnabled");
  },
});
