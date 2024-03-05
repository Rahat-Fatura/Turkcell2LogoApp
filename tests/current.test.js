const logger = require('../src/config/logger');
const { createNewCodeForCurrent } = require('../src/services/logo.service');

const main = async () => {
  const number = await createNewCodeForCurrent('BDM');
  logger.info(number);
  process.exit(0);
};

main();
