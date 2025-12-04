/* eslint-disable no-restricted-syntax */
const ubl2json = require('ubl2json');
const moment = require('moment');
const _ = require('lodash');
const async = require('async');
const invoicesModel = require('../models/invoices.model');
const turkcellService = require('./turkcell.service');
const logoService = require('./logo.service');
const {
  exportingInvoiceTypes,
  invoiceDirectionTypes,
  invoiceListTypes,
  invoiceDirectionTypesForDatabase,
} = require('../config/invoice.schema');
const logger = require('../config/logger');

const getInvoiceJsonFromUuid = async (id, direction) => {
  const xml = await turkcellService.exportInvoice(id, direction, exportingInvoiceTypes.xml);
  const json = await ubl2json.invoice.convertedJson(xml);
  return json;
};

const normalizeInvoice = async (invoice, direction) => {
  const currentObject =
    direction === invoiceDirectionTypesForDatabase.incoming ? invoice.sender_object : invoice.receiver_object;
  let logoCurrentRecord;
  try {
    logoCurrentRecord = await logoService.findCurrentFromInvoice(currentObject);
  } catch (error) {
    logger.error(error);
  }
  for await (const line of invoice.lines) {
    line.data = JSON.stringify(line);
    let logoLineRecord;
    try {
      logoLineRecord = await logoService.findItemFromInvoiceLine(line);
      line.logo_id = logoLineRecord ? logoLineRecord.id : null;
      line.logo_name = logoLineRecord ? logoLineRecord.name : null;
    } catch (error) {
      logger.error(error);
    }
  }
  let status = 100;
  if (logoCurrentRecord && !_.find(invoice.lines, (line) => line.logo_id === null || line.logo_id === undefined)) {
    status = 101;
  }
  return {
    status,
    uuid: String(invoice.uuid),
    direction,
    invoiceDate: invoice.issue_datetime,
    profile: String(invoice.profile_id),
    type: String(invoice.type_code),
    currentName:
      direction === invoiceDirectionTypesForDatabase.incoming ? String(invoice.sender_name) : String(invoice.receiver_name),
    currentTax:
      direction === invoiceDirectionTypesForDatabase.incoming ? String(invoice.sender_tax) : String(invoice.receiver_tax),
    logoCurrentId: logoCurrentRecord ? logoCurrentRecord.id : null,
    logoCurrentName: logoCurrentRecord ? logoCurrentRecord.name : null,
    data: JSON.stringify(invoice),
    InvoiceLines: {
      create: _.map(invoice.lines, (line) => {
        return {
          name: String(line.name),
          price: line.price,
          quantity: line.quantity,
          unit_code: String(line.quantity_unit),
          amount: line.extension_amount,
          data: line.data,
          logoItemId: line.logo_id,
          logoItemName: line.logo_name,
        };
      }),
    },
  };
};

const normalizeInvoiceListForUI = (invoices) => {
  const json = JSON.parse(invoices.data);
  return {
    status: invoices.status,
    id: invoices.id,
    uuid: invoices.uuid,
    number: json.number,
    direction: invoices.direction,
    profile_id: invoices.profile,
    type_code: invoices.type,
    issue_datetime: invoices.invoiceDate,
    company_tax: invoices.currentTax,
    company_name: invoices.currentName,
    payable_amount: json.payable_amount,
    currency_code: json.currency_code,
    logo_current_id: invoices.logoCurrentId,
    logo_current_name: invoices.logoCurrentName,
    logo_invoice_id: invoices.logoInvoiceId,
    logo_invoice_send_status: invoices.logoInvoiceSendStatus,
    logo_invoice_send_detail: invoices.logoInvoiceSendDetail,
    lines: _.map(invoices.InvoiceLines, (line) => {
      return {
        id: line.id,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        quantity_unit: line.unit_code,
        amount: line.amount,
        logo_item_id: line.logoItemId,
        logo_item_name: line.logoItemName,
      };
    }),
  };
};

const syncInvoicesToDatabase = async (
    startDate = moment()
        .utc(false)
        .subtract(7, "days")
        .format("YYYY-MM-DD HH:mm:ss"),
    endDate = moment().utc(false).add(1, "days").format("YYYY-MM-DD HH:mm:ss")
) => {
    const incomingInvoices = await turkcellService.listIncomings(
        startDate,
        endDate
    );
    const outgoingInvoices = await turkcellService.listOutgoings(
        invoiceListTypes.outgoing,
        startDate,
        endDate
    );
    const outgoingArchives = await turkcellService.listOutgoings(
        invoiceListTypes.outgoingArchive,
        startDate,
        endDate
    );
    const idsIn = _.map(incomingInvoices.items, "id");
    const idsOut = _.map(outgoingInvoices, "id");
    const idsArch = _.map(outgoingArchives, "id");
    console.log(idsIn.length, "incoming invoices");
    console.log(idsOut.length, "outgoing invoices");
    console.log(idsArch.length, "outgoing archives");
    const incomingInvoicesJson = await async.mapSeries(idsIn, async (id) => {
        const json = await getInvoiceJsonFromUuid(
            id,
            invoiceDirectionTypes.incoming
        );
        return json;
    });

    const outgoingInvoicesJson = await async.mapSeries(idsOut, async (id) => {
        const json = await getInvoiceJsonFromUuid(
            id,
            invoiceDirectionTypes.outgoing
        );
        return json;
    });

    const outgoingArchivesJson = await async.mapSeries(idsArch, async (id) => {
        const json = await getInvoiceJsonFromUuid(
            id,
            invoiceDirectionTypes.outgoingArchive
        );
        return json;
    });
    const allInvoices = [];
    for await (const invoice of incomingInvoicesJson) {
        console.log("normalizing incoming invoice");
        allInvoices.push(
            await normalizeInvoice(
                invoice,
                invoiceDirectionTypesForDatabase.incoming
            )
        );
    }
    for await (const invoice of outgoingInvoicesJson) {
        console.log("normalizing outgoing invoice");
        allInvoices.push(
            await normalizeInvoice(
                invoice,
                invoiceDirectionTypesForDatabase.outgoing
            )
        );
    }
    for await (const invoice of outgoingArchivesJson) {
        console.log("normalizing outgoing archive");
        allInvoices.push(
            await normalizeInvoice(
                invoice,
                invoiceDirectionTypesForDatabase.outgoing
            )
        );
    }

    const createdInvoices = await Promise.all(
        _.map(allInvoices, async (invoice) => {
            const invRecord = await invoicesModel.createInvoice(invoice);
            return invRecord;
        })
    );
    const createdInvoicesClearedNull = _.filter(createdInvoices, (invoice) => {
        return invoice !== undefined && invoice !== null;
    });
    return createdInvoicesClearedNull.length;
};


const listInvoices = async (startDate, endDate) => {
  const sDate = moment.utc(startDate).startOf('day').toDate();
  const eDate = moment.utc(endDate).endOf('day').toDate();
  let invoices = await invoicesModel.listInvoices(sDate, eDate);
  invoices = _.map(invoices, (invoice) => {
    return normalizeInvoiceListForUI(invoice);
  });
  return invoices;
};

const updateInvoiceCurrent = async (invoiceId, logoCurrentId, logoCurrentName) => {
  const updatedInvoice = await invoicesModel.updateInvoiceCurrent(invoiceId, logoCurrentId, logoCurrentName);
  return updatedInvoice;
};

const updateInvoiceLineItem = async (lineId, logoItemId, logoItemName) => {
  const updatedInvoice = await invoicesModel.updateInvoiceLineItem(lineId, logoItemId, logoItemName);
  return updatedInvoice;
};

module.exports = {
  getInvoiceJsonFromUuid,
  syncInvoicesToDatabase,
  listInvoices,
  updateInvoiceCurrent,
  updateInvoiceLineItem,
};
