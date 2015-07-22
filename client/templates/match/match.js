Template.match.onRendered(function() {

  // ask user for desktop permissions
  if (notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
    notify.requestPermission();
  }

});
