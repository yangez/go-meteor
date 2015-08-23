Template.navMenu.helpers({
  routeIsNot: function(routeName) {
    var currentRouteName = Router.current().route.getName();
    return routeName !== currentRouteName;
  },

});
