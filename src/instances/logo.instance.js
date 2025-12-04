const axios = require('axios');
const config = require('../config/config');

const { url } = config.logo.credentials;

const logo = axios.create({
  baseURL: url,
});

logo.interceptors.request.use((request) => {
  // request.headers['Content-Type'] = 'application/json';
  return request;
});

logo.interceptors.response.use(
  (response) => {
	  console.log(response); 
	  return response;
  },
  (error) => {
	console.log(JSON.stringify(error));
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Logo servisine erişilemiyor.');
    }
    throw new Error(JSON.stringify(error.response.data));
  },
);

module.exports = logo;
