/* eslint-disable dot-notation */
module.exports = (request, response, next) => {
  const app = {
    name: 'RS Turkcell',
    code: 'rs-turkcell',
    logo: '/img/logo/rst-logo/1x/rs-turkcell-logo.png',
    logo_light: 'logo/rd-logo-light/1x/rs-turkcell-logo-light.png',
    logo_dark: 'logo/rd-logo/1x/rs-turkcell-logo.png',
    favicon: '/img/favicon/favicon.ico',
  };
  response['locals']['app'] = app;
  response['locals']['user'] = {
    name: 'RS Turkcell',
    email: 'info@rahatsistem.com.tr',
  };
  next();
};
