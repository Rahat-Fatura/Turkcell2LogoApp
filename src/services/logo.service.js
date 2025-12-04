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
        SOURCE_MT_REFERENCE: serieLot.STTRANSREF,
        SOURCE_SLT_REFERENCE: serieLot.LOGICALREF,
        SOURCE_QUANTITY: 1,
        IOCODE: 4,
        SL_TYPE: 2,
        SL_CODE: serieLotCode,
        MU_QUANTITY: 1,
        QUANTITY: 1,
        UNIT_CODE: 'ADET',
        UNIT_CONV1: 1,
        UNIT_CONV2: 1,
        DATE_EXPIRED: serieLot.EXPDATE,
        SLREF: serieLot.SLREF,
      };
    }
  }
  return null;
};

const getToken = async () => {
  const token = await serviceModel.getToken();
  if (!token || token.expires < moment().utc(false).toDate()) {
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
      console.error('Logo token error:', error)
      throw new Error('Logo servisine erişilemiyor.');
    }
    await serviceModel.setToken(
      newToken.data.access_token,
      moment().utc(false).add(newToken.data.expires_in, 'seconds').toDate(),
    );
    return newToken.data.access_token;
  }
  return token.token;
};

const createNewCodeForCurrent = async (serie) => {
  const sql = await connect();
  const lastCode = await sql.query(queries.current.getLastCodeBySerie(serie));
  if (lastCode.recordset[0].code === null) return `${serie}00000000001`;
  const lastCodeNumber = parseInt(lastCode.recordset[0].code.substring(3), 10);
  return `${serie}${_.padStart((lastCodeNumber + 1).toString(), lastCode.recordset[0].code.substring(3).length, '0')}`;
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
    CODE: await createNewCodeForCurrent(invNo.substring(0, 3)),
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
  };
};

const createCurrent = async (invNo, currentObject) => {
  const currentJsonForLogo = await normalizeCurrentForLogo(invNo, currentObject);
  const createdCurrent = await logo.post('/arps', currentJsonForLogo, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });
  return createdCurrent.data;
};

const getSourceWh = (invoiceNumber) => {
  const serie = invoiceNumber.substring(0, 3);
  const sources = config.logo.params.sourceWh;
  const source = _.find(sources, (s) => s.serie === serie);
  if (!source) {
    return 0;
  }
  return source.value;
};

const getItemSourceWh = async (slRef, invoiceNumber) => {
  const sql = await connect();
  const destIndex = await sql.query(queries.items.getItemSourceIndex(slRef));
  if (destIndex.recordset.length === 0) {
    return getSourceWh(invoiceNumber);
  }
  return destIndex.recordset[0].SOURCEINDEX;
};

// const getSourceCode = (invoiceNumber) => {
//   const serie = invoiceNumber.substring(0, 3);
//   const sources = config.logo.params.sourceWh;
//   const source = _.find(sources, (s) => s.serie === serie);
//   return source.code;
// };

// const getSourceRef = (invoiceNumber) => {
//   const serie = invoiceNumber.substring(0, 3);
//   const sources = config.logo.params.sourceWh;
//   const source = _.find(sources, (s) => s.serie === serie);
//   return source.accref;
// };

const normalizeInvoiceForLogo = async (invoiceId) => {
  const invoice = await invoicesModel.getInvoiceById(invoiceId);
  const json = JSON.parse(invoice.data);
  const currentObject = invoice.direction === 1 ? json.receiver_object : json.sender_object;
  let logoCurrent;
  if (invoice.logoCurrentId === null) {
    const findedCurrent = await findCurrentFromInvoice(currentObject);
    if (findedCurrent) {
      invoice.logoCurrentId = findedCurrent.id;
    }
  }
  if (invoice.logoCurrentId === null) {
    const current = await createCurrent(json.number, invoice.direction === 1 ? json.receiver_object : json.sender_object);
    logoCurrent = await getCurrentFromId(current.INTERNAL_REFERENCE);
  } else {
    logoCurrent = await getCurrentFromId(invoice.logoCurrentId);
  }
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
      const wh = await getItemSourceWh(_.filter(slDetail, (detail) => detail !== null)[0].SLREF, json.number);
      slDetails = {
        SL_DETAILS: {
          items: _.filter(slDetail, (detail) => detail !== null).map((detail) => ({
            SOURCE_WH: wh,
			DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            ...detail,
          })),
        },
      };
    }
    logoLines.push({
      TYPE: 0,
	  DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      MASTER_CODE: logoObject.CODE,
      QUANTITY: line.quantity,
      PRICE: line.price * (1 + (_.find(line.data.tax_subtotals, (tax) => tax.code === '0015')?.percent || 0) / 100),
      VAT_RATE: _.find(line.data.tax_subtotals, (tax) => tax.code === '0015')?.percent || 0,
      UNIT_CODE: config.logo.params.units[line.data.quantity_unit],
      UNIT_CONV1: 1,
      UNIT_CONV2: 1,
      SOURCEINDEX: slDetails.SL_DETAILS ? slDetails.SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
      SOURCECOSTGRP: slDetails.SL_DETAILS ? slDetails.SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
      EDTCURR_GLOBAL_CODE: 'USD',
      VAT_INCLUDED: 1,
      DISPATCH_NUMBER: json.number,
      // GL_CODE1: getSourceCode(json.number),
      // GL_CODE2: getSourceCode(json.number),
      // GL_CODE3: getSourceCode(json.number),
      ...slDetails,
    });
  }
  const logoJson = {
    INTERNAL_REFERENCE: 1,
    TYPE: 7,
    NUMBER: json.number,
    FICHENO: json.number,
    // GL_CODE: config.logo.params.gl_code_1,
    DOC_NUMBER: json.number,
    DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    DOC_DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    // TIME: moment(json.issue_datetime).endOf('day').format('HH:mm:ss'),
    AUXIL_CODE: json.number.substring(0, 3),
    // ACCOUNTREF: getSourceRef(json.number),
    // GL_CODE: getSourceCode(json.number),
    SOURCE_WH: logoLines[0].SL_DETAILS ? logoLines[0].SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
    SOURCE_COST_GRP: logoLines[0].SL_DETAILS ? logoLines[0].SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
    ARP_CODE: logoCurrent.CODE,
    NOTES1: invoice.currentName.substring(0, 60),
    EDTCURR_GLOBAL_CODE: 'USD',
    CURR_INVOICE: 0,
    PAYDEFREF: 1,
    VAT_INCLUDED_GRS: 1,
    CURRSEL_TOTALS: 1,
    CURRSEL_DETAILS: 0,
    VAT_RATE: _.find(json.tax_subtotals, (tax) => tax.code === '0015').percent,
    DISPATCHES: {
      items: [
        {
          INTERNAL_REFERENCE: 0,
		  DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          TYPE: 7,
          GRPCODE: 2,
          IOCODE: 3,
          NUMBER: json.number,
          DATE: moment.utc(json.issue_datetime).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          SOURCE_WH: logoLines[0].SL_DETAILS ? logoLines[0].SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
          SOURCE_COST_GRP: logoLines[0].SL_DETAILS ? logoLines[0].SL_DETAILS.items[0].SOURCE_WH : getSourceWh(json.number),
          // TIME: moment(json.issue_datetime).format('HH:mm:ss'),
          INVOICE_NUMBER: json.number,
          TOTAL_NET: json.payable_amount,
        },
      ],
    },
    TRANSACTIONS: {
      items: logoLines,
    },
  };
  console.log(JSON.stringify(logoJson));
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
