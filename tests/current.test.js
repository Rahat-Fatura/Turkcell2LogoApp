const logger = require('../src/config/logger');
const { getInvoiceJsonFromUuid } = require('../src/services/invoices.service');
const { invoiceDirectionTypes } = require('../src/config/invoice.schema');

const main = async () => {
  // const number = await createNewCodeForCurrent('BDM');
  // logger.info(number);
  const invoice = await getInvoiceJsonFromUuid('0050569C', invoiceDirectionTypes.outgoing);
  const invoice2 = await getInvoiceJsonFromUuid('0050569C', invoiceDirectionTypes.outgoing);
  invoice.lines.forEach((line) => {
    logger.info('inv1-line', line);
  });
  invoice2.lines.forEach((line) => {
    logger.info('inv2-line', line);
  });
  process.exit(0);
};

main();
