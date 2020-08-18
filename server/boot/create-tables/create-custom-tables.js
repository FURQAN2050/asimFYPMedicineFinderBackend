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
  ds.autoupdate('medicine', function(err) {
    if (err) throw err;
    console.log('medicine table created');
  });
  ds.autoupdate('medicalstore', function(err) {
    if (err) throw err;
    console.log('medicalstore table created');
  });

  ds.autoupdate('favourite', function(err) {
    if (err) throw err;
    console.log('favourite table created');
  });
  ds.autoupdate('medicinerequest', function(err) {
    if (err) throw err;
    console.log('medicinerequest table created');
  });
};
