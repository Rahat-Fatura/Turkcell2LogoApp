const moment = require('moment');
const turkcell = require('../instances/turkcell.instance');

const listIncomings = async (
  startDate = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
  endDate = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
) => {
  const response = await turkcell.get('/v1/inboxinvoice/list', {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data;
};

const listOutgoings = async (
  listType,
  startDate = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
  endDate = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
) => {
  const response = await turkcell.get(listType, {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data;
};

const exportInvoice = async (id, direction, type) => {
  const response = await turkcell.get(`/v2/${direction}/${id}/${type}`);
  return response.data;
};

module.exports = {
  listIncomings,
  listOutgoings,
  exportInvoice,
};
