'use strict';

module.exports = function(app) {
  const numModels = Object.keys(app.models).length;
  for (let dataSource of Object.values(app.dataSources)) {
    dataSource.setMaxListeners(numModels);
  }
  var ds = app.dataSources.mySqlDs;

  ds.autoupdate('account', function(err) {
    if (err) throw err;
    console.log('account table created');
  });
};
