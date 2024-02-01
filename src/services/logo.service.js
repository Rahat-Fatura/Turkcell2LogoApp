/* eslint-disable no-restricted-syntax */
const moment = require('moment');
const axios = require('axios');
const _ = require('lodash');
const { connect } = require('../utils/mssql');
const logo = require('../instances/logo.instance');
const queries = require('../config/queries');
const config = require('../config/config');
const logger = require('../config/logger');
const { serviceModel, invoicesModel } = require('../models');

const getCurrentFromTax = async (tax) => {
  const sql = await connect();
  const current = await sql.query(queries.current.findByTaxNumber(tax));
  return current.recordset[0];
};

const getCurrentFromId = async (id) => {
  const sql = await connect();
  const current = await sql.query(queries.current.findById(id));
  return current.recordset[0];
};

const searchCurrentFromCodeAndName = async (str) => {
  const sql = await connect();
  const current = await sql.query(queries.current.searchByCodeAndName(str));
  return current.recordset;
};

const searchItemsFromCodeAndName = async (str) => {
  const sql = await connect();
  const items = await sql.query(queries.items.searchByCodeAndName(str));
  return items.recordset;
};

const findCurrentFromInvoice = async (currentObject) => {
  const sql = await connect();
  let current;
  const fromTax = await sql.query(queries.current.findByTaxNumber(currentObject.vkn_tckn));
  if (fromTax.recordset.length !== 0) {
    [current] = fromTax.recordset;
  }
  return current;
};

const findItemFromInvoiceLine = async (line) => {
  const sql = await connect();
  if (line.additional?.buyers_item_id) {
    const fromBuyerCode = await sql.query(queries.items.findByCode(line.additional?.buyers_item_id));
    if (fromBuyerCode.recordset.length !== 0) {
      return fromBuyerCode.recordset[0];
    }
  }
  if (line.additional?.sellers_item_id) {
    const fromSellerCode = await sql.query(queries.items.findByCode(line.additional?.sellers_item_id));
    if (fromSellerCode.recordset.length !== 0) {
      return fromSellerCode.recordset[0];
    }
  }
  if (line.additional?.manufacturers_item_id) {
    const fromManufacturersCode = await sql.query(queries.items.findByCode(line.additional?.manufacturers_item_id));
    if (fromManufacturersCode.recordset.length !== 0) {
      return fromManufacturersCode.recordset[0];
    }
  }
  if (line.additional?.instance) {
    if (line.additional?.instance[0]?.serial_id) {
      const serieLotTransId = await sql.query(queries.serieLots.findByCode(line.additional?.instance[0]?.serial_id));
      if (serieLotTransId.recordset.length !== 0) {
        const fromSerieLotId = await sql.query(queries.items.findBySerieLotId(serieLotTransId.recordset[0].id));
        if (fromSerieLotId.recordset.length !== 0) {
          return fromSerieLotId.recordset[0];
        }
      }
    }
  }
  if (line.name) {
    const fromName = await sql.query(queries.items.findByName(line.name));
    if (fromName.recordset.length !== 0) {
      return fromName.recordset[0];
    }
  }
  return undefined;
};

const getItemById = async (itemId) => {
  const sql = await connect();
  const item = await sql.query(queries.items.findById(itemId));
  return item.recordset[0];
};

const findSerieLotDetail = async (serieLotCode) => {
  const sql = await connect();
  const serieLotTransId = await sql.query(queries.serieLots.findByCode(serieLotCode));
  if (serieLotTransId.recordset.length !== 0) {
    const fromSerieLotId = await sql.query(queries.serieLots.findTransById(serieLotTransId.recordset[0].id));
    if (fromSerieLotId.recordset.length !== 0) {
      const serieLot = fromSerieLotId.recordset[0];
      return {
        SOURCE_SLT_REFERENCE: serieLot.LOGICALREF,
        SLTYPE: serieLot.REMAMOUNT,
        MU_QUANTITY: 1,
        REMLNUNITAMNT: serieLot.REMLNUNITAMNT,
        REMAMOUNT: serieLot.REMAMOUNT,
        AMOUNT: serieLot.AMOUNT,
        MAINAMOUNT: serieLot.MAINAMOUNT,
        UINFO1: 1,
        UINFO2: 1,
        SL_CODE: serieLot.CODE,
        DATE_EXPIRED: serieLot.EXPDATE,
        SLREF: serieLot.SLREF,
      };
    }
  }
  return null;
};

const getToken = async () => {
  const token = await serviceModel.getToken();
  if (!token || token.expires < moment().utc(true).toDate()) {
    let newToken;
    try {
      newToken = await axios({
        method: 'post',
        url: `${config.logo.credentials.url}/token`,
        data: `grant_type=password&username=${config.logo.credentials.username}&password=${config.logo.credentials.password}&firmno=${config.logo.credentials.firmno}`,
        headers: { 'Content-Type': 'multipart/form-data' },
        auth: {
          username: config.logo.credentials.basic_username,
          password: config.logo.credentials.basic_password,
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Logo servisine erişilemiyor.');
    }
    await serviceModel.setToken(
      newToken.data.access_token,
      moment().utc(true).add(newToken.data.expires_in, 'seconds').toDate(),
    );
    return newToken.data.access_token;
  }
  return token.token;
};

const normalizeCurrentForLogo = async (invNo, currentObject) => {
  let taxno;
  let tckno;
  if (currentObject.vkn_tckn.length === 10) {
    taxno = currentObject.vkn_tckn;
    tckno = null;
  } else {
    taxno = null;
    tckno = currentObject.vkn_tckn;
  }
  return {
    CODE: invNo,
    TITLE: currentObject.name,
    ACCOUNT_TYPE: 3,
    ADDRESS1: currentObject.address,
    CITY: currentObject.city,
    EMAILADDR: currentObject.email,
    DISTRICT: currentObject.city_subdivision,
    COUNTRYCODE: 'TR',
    COUNTRY: 'TÜRKİYE',
    NAME: currentObject.name,
    SURNAME: '',
    TAXNR: taxno,
    TCKNO: tckno,
    TAXOFFICE: currentObject.tax_office,
    CORRESP_LANG: 1,
    INVOICE_PRNT_CNT: 1,
    PURCHBRWS: 1,
    SALESBRWS: 1,
    IMPBRWS: 1,
    EXPBRWS: 1,
    FINBRWS: 1,
    AUXIL_CODE: '',
    GL_CODE: config.logo.params.cari_muhasebe_kodu,
  };
};

const createCurrent = async (currentObject) => {
  const currentJsonForLogo = await normalizeCurrentForLogo(currentObject);
  const createdCurrent = await logo.post('/arps', currentJsonForLogo, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });
  return createdCurrent;
};

const normalizeInvoiceForLogo = async (invoiceId) => {
  const invoice = await invoicesModel.getInvoiceById(invoiceId);
  const logoCurrent = await getCurrentFromId(invoice.logoCurrentId);
  const json = JSON.parse(invoice.data);
  const logoLines = [];
  for await (const line of invoice.InvoiceLines) {
    line.data = JSON.parse(line.data);
    const logoObject = await getItemById(line.logoItemId);
    let slDetails = {};
    const slDetail = [];
    if (line.data.additional?.instance) {
      for await (const instance of line.data.additional.instance) {
        if (instance?.serial_id) {
          slDetail.push(await findSerieLotDetail(instance.serial_id));
        }
      }
    }
    if (_.filter(slDetail, (detail) => detail !== null).length > 0) {
      slDetails = {
        items: {
          SL_DETAILS: _.filter(slDetail, (detail) => detail !== null),
        },
      };
    }
    logoLines.push({
      TYPE: 0,
      MASTER_CODE: logoObject.CODE,
      QUANTITY: line.quantity,
      PRICE: line.price,
      VAT_RATE: _.find(json.tax_subtotals, (tax) => tax.code === '0015').percent,
      UNIT_CODE: config.logo.params.units[line.data.quantity_unit],
      UNIT_CONV1: 1,
      UNIT_CONV2: 1,
      EDTCURR_GLOBAL_CODE: config.logo.params.currency[json.currency_code],
      DISPATCH_NUMBER: json.number,
      GL_CODE1: config.logo.params.gl_code_1,
      GL_CODE2: config.logo.params.gl_code_2,
      ...slDetails,
    });
  }
  const logoJson = {
    INTERNAL_REFERENCE: 1,
    TYPE: 8,
    NUMBER: json.number,
    FICHENO: json.number,
    GL_CODE: config.logo.params.gl_code_1,
    DOC_NUMBER: json.number,
    DATE: moment(json.issue_datetime).format('YYYY-MM-DD HH:mm:ss'),
    DOC_DATE: moment(json.issue_datetime).format('YYYY-MM-DD HH:mm:ss'),
    // TIME: moment(json.issue_datetime).format('HH:mm:ss'),
    ARP_CODE: logoCurrent.CODE,
    EDTCURR_GLOBAL_CODE: config.logo.params.currency[json.currency_code],
    CURRSEL_TOTALS: 2,
    AMOUNT: 1,
    REMLNUNITAMNT: 1,
    CURRSEL_DETAILS: 2,
    VAT_RATE: _.find(json.tax_subtotals, (tax) => tax.code === '0015').percent,
    DISPATCHES: {
      items: [
        {
          INTERNAL_REFERENCE: 0,
          TYPE: 8,
          GRPCODE: 2,
          IOCODE: 3,
          NUMBER: json.number,
          DATE: moment(json.issue_datetime).format('YYYY-MM-DD HH:mm:ss'),
          // TIME: moment(json.issue_datetime).format('HH:mm:ss'),
          INVOICE_NUMBER: json.number,
        },
      ],
    },
    TRANSACTIONS: {
      items: logoLines,
    },
  };
  return logoJson;
};

const sendInvoiceToLogo = async (invoiceId) => {
  let sendInvoice;
  let jsonForLogo;
  try {
    jsonForLogo = await normalizeInvoiceForLogo(invoiceId);
    sendInvoice = await logo.post('/salesInvoices', jsonForLogo, {
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
    });
    await invoicesModel.updateInvoiceLogoStatus(
      invoiceId,
      sendInvoice.data.INTERNAL_REFERENCE,
      sendInvoice.data,
      jsonForLogo,
    );
  } catch (error) {
    await invoicesModel.updateInvoiceLogoStatus(invoiceId, null, error.message, jsonForLogo);
  }
  return sendInvoice;
};

module.exports = {
  getCurrentFromTax,
  getCurrentFromId,
  findCurrentFromInvoice,
  findItemFromInvoiceLine,
  searchCurrentFromCodeAndName,
  searchItemsFromCodeAndName,
  getItemById,
  findSerieLotDetail,
  getToken,
  sendInvoiceToLogo,
  createCurrent,
};
