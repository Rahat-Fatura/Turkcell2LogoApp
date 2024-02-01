const { invoicesService, logoService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const getDashboardPage = async (req, res) => {
  return res.render('pages/dashboard/dashboard', {
    page: {
      name: 'dashboard',
      display: 'Kontrol Paneli',
      menu: 'dashboard',
      uppermenu: 'dashboard',
    },
  });
};

const syncInvoices = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const createdLength = await invoicesService.syncInvoicesToDatabase(startDate, endDate);
  return res.send({
    message: `${createdLength} adet fatura senkronize edildi.`,
  });
});

const listInvoices = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const invoices = await invoicesService.listInvoices(startDate, endDate);
  return res.send(invoices);
});

const searchCurrent = catchAsync(async (req, res) => {
  const { q } = req.query;
  const current = await logoService.searchCurrentFromCodeAndName(q);
  return res.send(current);
});

const searchItems = catchAsync(async (req, res) => {
  const { q } = req.query;
  const items = await logoService.searchItemsFromCodeAndName(q);
  return res.send(items);
});

const updateInvoiceCurrent = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;
  const { logoCurrentId, logoCurrentName } = req.body;
  const updatedInvoice = await invoicesService.updateInvoiceCurrent(invoiceId, logoCurrentId, logoCurrentName);
  return res.send(updatedInvoice);
});

const updateInvoiceItems = catchAsync(async (req, res) => {
  const { lineId } = req.params;
  const { logoItemId, logoItemName } = req.body;
  const updatedInvoice = await invoicesService.updateInvoiceLineItem(lineId, logoItemId, logoItemName);
  return res.send(updatedInvoice);
});

const sendInvoiceToLogo = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;
  const sendInvoice = await logoService.sendInvoiceToLogo(invoiceId);
  return res.send(sendInvoice);
});

const test = catchAsync(async (req, res) => {
  const { q } = req.query;
  const sendInvoice = await logoService.sendInvoiceToLogo(q);
  return res.send(sendInvoice);
});

module.exports = {
  getDashboardPage,
  syncInvoices,
  listInvoices,
  searchCurrent,
  searchItems,
  updateInvoiceCurrent,
  updateInvoiceItems,
  sendInvoiceToLogo,
  test,
};
