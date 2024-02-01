const _ = require('lodash');
const database = require('../utils/database');

const createInvoice = async (invoice) => {
  try {
    const invRecord = await database.invoices.create({
      data: invoice,
    });
    return invRecord;
  } catch (error) {
    if (error.code === 'P2002') return;
    // logger.error(error);
    throw new Error(error);
  }
};

const getInvoiceByUuid = async (uuid) => {
  const invRecord = await database.invoices.findFirst({
    where: {
      uuid,
    },
  });
  return invRecord;
};

const getInvoiceById = async (id) => {
  const invRecord = await database.invoices.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      InvoiceLines: true,
    },
  });
  return invRecord;
};

const getLineById = async (id) => {
  const lineRecord = await database.invoiceLines.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      invoice: true,
    },
  });
  return lineRecord;
};

const listInvoices = async (startDate, endDate) => {
  const invoices = await database.invoices.findMany({
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      InvoiceLines: true,
    },
    orderBy: {
      invoiceDate: 'desc',
    },
  });
  return invoices;
};

const getInvoiceLiveStatus = async (invoiceId) => {
  const invoice = await getInvoiceById(invoiceId);
  let status = 100;
  if (
    !_.find(invoice.InvoiceLines, (line) => line.logoItemId === null || line.logoItemName === undefined) &&
    invoice.logoCurrentId
  ) {
    status = 101;
  }
  if (invoice.logoInvoiceSendStatus === 1) {
    if (invoice.logoInvoiceId) {
      status = 200;
    } else {
      status = 400;
    }
  }
  return status;
};

const updateInvoiceStatus = async (invoiceId) => {
  const status = await getInvoiceLiveStatus(invoiceId);
  const updatedInvoice = await database.invoices.update({
    where: {
      id: Number(invoiceId),
    },
    data: {
      status,
    },
  });
  return updatedInvoice;
};

const updateInvoiceCurrent = async (invoiceId, logoCurrentId, logoCurrentName) => {
  await database.invoices.update({
    where: {
      id: Number(invoiceId),
    },
    data: {
      logoCurrentId: logoCurrentId ? Number(logoCurrentId) : null,
      logoCurrentName: logoCurrentName ? String(logoCurrentName) : null,
    },
  });
  const updatedInvoice = await updateInvoiceStatus(invoiceId);
  return updatedInvoice;
};

const updateInvoiceLineItem = async (lineId, logoItemId, logoItemName) => {
  const updatedLine = await database.invoiceLines.update({
    where: {
      id: Number(lineId),
    },
    data: {
      logoItemId: logoItemId ? Number(logoItemId) : null,
      logoItemName: logoItemName ? String(logoItemName) : null,
    },
  });
  const lineRecord = await getLineById(lineId);
  await updateInvoiceStatus(lineRecord.invoice.id);
  return updatedLine;
};

const updateInvoiceLogoStatus = async (invoiceId, logoInvoiceId, logoInvoiceSendDetail, jsonForLogo) => {
  const updatedInvoice = await database.invoices.update({
    where: {
      id: Number(invoiceId),
    },
    data: {
      logoInvoiceId: logoInvoiceId ? Number(logoInvoiceId) : null,
      logoInvoiceSendStatus: 1,
      // eslint-disable-next-line no-nested-ternary
      logoInvoiceSendDetail: logoInvoiceSendDetail
        ? typeof logoInvoiceSendDetail === 'object'
          ? JSON.stringify(logoInvoiceSendDetail)
          : logoInvoiceSendDetail
        : {},
      logoSendedBody: jsonForLogo ? JSON.stringify(jsonForLogo) : null,
    },
  });
  await updateInvoiceStatus(invoiceId);
  return updatedInvoice;
};

module.exports = {
  createInvoice,
  getInvoiceByUuid,
  getInvoiceById,
  listInvoices,
  updateInvoiceCurrent,
  updateInvoiceLineItem,
  updateInvoiceLogoStatus,
};
