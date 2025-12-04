const axios = require('axios');
const crypto = require('crypto');
const https = require('https');
const axiosRetry = require('axios-retry').default;
const rateLimit = require('axios-rate-limit');
const logger = require('../config/logger');
const config = require('../config/config');

const { url, key } = config.turkcell;

const turkcellBase = axios.create({
  baseURL: url,
  httpsAgent: new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

const turkcell = rateLimit(turkcellBase, { 
  maxRequests: 1, 
  perMilliseconds: 1100 
});

axiosRetry(turkcell, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  onRetry: (retryCount, error, requestConfig) => {
    logger.error(
      `Request failed with ${error.code}. Retry attempt #${retryCount}, method=${requestConfig.method} url=${requestConfig.url}`,
    );
  },
});

turkcell.interceptors.request.use((request) => {
  request.headers['Content-Type'] = 'application/json';
  request.headers['x-api-key'] = key;
  return request;
});

turkcell.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(error);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Turkcell servisine erişilemiyor.');
    }
    throw new Error(JSON.stringify(error.response));
  },
);

module.exports = turkcell;