Template.layout.helpers({
  routeIs: function(routeName) {
    var currentRouteName = Router.current().route.getName();
    return routeName === currentRouteName;
  },
  routeIsNot: function(routeName) {
    var currentRouteName = Router.current().route.getName();
    return routeName !== currentRouteName;
  },

});
