const exportingInvoiceTypes = {
  pdf: 'pdf/false',
  html: 'html/false',
  xml: 'ubl',
};

const invoiceDirectionTypes = {
  incoming: 'inboxinvoice',
  outgoing: 'outboxinvoice',
  outgoingArchive: 'earchive',
};

const invoiceListTypes = {
  incoming: '/v1/inboxinvoice/list',
  outgoing: '/v2/outboxinvoice/withnulllocalreferences',
  outgoingArchive: '/v2/earchive/withnulllocalreferences',
};

const invoiceDirectionTypesForDatabase = {
  outgoing: 1,
  incoming: 2,
};

module.exports = {
  exportingInvoiceTypes,
  invoiceDirectionTypes,
  invoiceListTypes,
  invoiceDirectionTypesForDatabase,
};
