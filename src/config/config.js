const Joi = require('joi');
const config = require('config');

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Env validation error: ${error.message}`);
}

const configVarsSchema = Joi.object().keys({
  port: Joi.number().default(3000),
  mssql: Joi.object()
    .keys({
      url: Joi.string().required().description('MSSQL URL'),
    })
    .required(),
  turkcell: Joi.object()
    .keys({
      url: Joi.string().required().description('Turkcell URL'),
      key: Joi.string().required().description('Turkcell API Key'),
    })
    .required(),
  logo: Joi.object()
    .keys({
      credentials: Joi.object().keys({
        url: Joi.string().required().description('Logo URL'),
        username: Joi.string().required().description('Logo kullanıcı adı'),
        password: Joi.string().required().description('Logo şifre'),
        firmno: Joi.number().required().description('Logo firma no'),
        secret: Joi.string().required().description('Logo secret'),
        basic_username: Joi.string().required().description('Logo basic kullanıcı adı'),
        basic_password: Joi.string().required().description('Logo basic şifre'),
      }),
      firma: Joi.string().required().description('Firma kodu'),
      donem: Joi.string().required().description('Dönem kodu'),
      params: Joi.object().keys({
        cari_muhasebe_kodu: Joi.string().required().description('Cari muhasebe kodu'),
        gl_code_1: Joi.string().required().description('GL Code 1'),
        gl_code_2: Joi.string().required().description('GL Code 2'),
        units: Joi.object().unknown().required().description('Birimler'),
        currency: Joi.object().unknown().required().description('Para birimleri'),
        sourceWh: Joi.array().items(Joi.object().unknown()).required().description('Kaynak depolar'),
      }),
    })
    .required(),
});

const { value: configVars, errorConf } = configVarsSchema.prefs({ errors: { label: 'key' } }).validate(config);

if (errorConf) {
  throw new Error(`Config validation error: ${errorConf.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: configVars.port,
  turkcell: {
    url: configVars.turkcell.url,
    key: configVars.turkcell.key,
  },
  mssql: {
    url: configVars.mssql.url,
  },
  logo: {
    credentials: {
      url: configVars.logo.credentials.url,
      username: configVars.logo.credentials.username,
      password: configVars.logo.credentials.password,
      firmno: configVars.logo.credentials.firmno,
      secret: configVars.logo.credentials.secret,
      basic_username: configVars.logo.credentials.basic_username,
      basic_password: configVars.logo.credentials.basic_password,
    },
    firma: configVars.logo.firma,
    donem: configVars.logo.donem,
    params: {
      cari_muhasebe_kodu: configVars.logo.params.cari_muhasebe_kodu,
      gl_code_1: configVars.logo.params.gl_code_1,
      gl_code_2: configVars.logo.params.gl_code_2,
      units: configVars.logo.params.units,
      currency: configVars.logo.params.currency,
      sourceWh: configVars.logo.params.sourceWh,
    },
  },
};
