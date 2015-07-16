Template.layout.helpers({
  routeIs: function(routeName) {
    var currentRouteName = Router.current().route.getName();
    console.log(currentRouteName);
    return routeName === currentRouteName;
  }

});
