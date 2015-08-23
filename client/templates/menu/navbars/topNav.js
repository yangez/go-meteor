Template.topNav.helpers({
  routeIsNot: function(routeName) {
    var currentRouteName = Router.current().route.getName();
    return routeName !== currentRouteName;
  },
  routeName: function() {
    return _.capitalize(Router.current().route.getName());
  }
});
