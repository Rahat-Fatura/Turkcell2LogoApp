const express = require('express');
const { dashboardController } = require('../controllers');

const router = express.Router();

router.get('/', dashboardController.getDashboardPage);
router.get('/sync-invoices', dashboardController.syncInvoices);
router.get('/list-invoices', dashboardController.listInvoices);
router.get('/search-currents', dashboardController.searchCurrent);
router.put('/update-invoice-current/:invoiceId', dashboardController.updateInvoiceCurrent);
router.get('/search-items', dashboardController.searchItems);
router.put('/update-line-item/:lineId', dashboardController.updateInvoiceItems);
router.put('/send-invoice-to-logo/:invoiceId', dashboardController.sendInvoiceToLogo);
router.get('/test', dashboardController.test);

module.exports = router;
