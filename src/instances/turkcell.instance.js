const axios = require('axios');
const config = require('../config/config');

const { url, key } = config.turkcell;

const turkcell = axios.create({
  baseURL: url,
});

turkcell.interceptors.request.use((request) => {
  request.headers['Content-Type'] = 'application/json';
  request.headers['x-api-key'] = key;
  return request;
});

turkcell.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Turkcell servisine erişilemiyor.');
    }
    throw new Error(JSON.stringify(error.response));
  },
);

module.exports = turkcell;
