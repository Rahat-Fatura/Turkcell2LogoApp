const mssql = require('mssql');
const config = require('../config/config');

let sqlConnection = null;

const connect = async () => {
  if (sqlConnection) {
    return sqlConnection.request();
  }
  sqlConnection = await mssql.connect(config.mssql.url);
  return sqlConnection.request();
};

module.exports = {
  connect,
};
