'use strict';

module.exports = function(app) {
  var ds = app.dataSources.mySqlDs;
  ds.automigrate([
    'User',
    'ACL',
    'RoleMapping',
    'Role',
    'AccessToken',
  ], function(err) {
    if (err) throw err;
    console.log(`native tables created
    User
    ACL
    RoleMapping
    Role
    AccessToken`);
  });
};
