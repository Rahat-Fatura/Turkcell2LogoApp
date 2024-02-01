const database = require('../utils/database');

const getToken = async () => {
  const token = await database.service.findFirst();
  return token;
};

const setToken = async (token, expires) => {
  const tokenRecord = await database.service.upsert({
    where: {
      id: 1,
    },
    update: {
      token,
      expires,
    },
    create: {
      token,
      expires,
    },
  });
  return tokenRecord;
};

module.exports = {
  getToken,
  setToken,
};
