const config = require('./config');

module.exports = {
  current: {
    findById: (currentId) => {
      return `SELECT * FROM LG_${config.logo.firma}_CLCARD WHERE LOGICALREF = ${currentId}`;
    },
    findByTaxNumber: (currentTax) => {
      return `SELECT LOGICALREF AS id, DEFINITION_ AS name FROM LG_${config.logo.firma}_CLCARD WHERE TCKNO = '${currentTax}' or TAXNR = '${currentTax}'`;
    },
    searchByCodeAndName: (text) => {
      return `SELECT LOGICALREF AS id, DEFINITION_ AS name, CODE AS code FROM LG_${config.logo.firma}_CLCARD WHERE CODE LIKE '%${text}%' OR DEFINITION_ LIKE '%${text}%'`;
    },
    getLastCodeBySerie: (serie) => {
      return `SELECT MAX(CODE) AS code FROM LG_${config.logo.firma}_CLCARD WHERE CODE LIKE '${serie}0%'`;
    },
  },
  serieLots: {
    findByCode: (seriLotCode) => {
      return `SELECT LOGICALREF AS id FROM LG_${config.logo.firma}_${config.logo.donem}_SERILOTN WHERE CODE = '${seriLotCode}'`;
    },
    findTransById: (seriLotId) => {
      return `SELECT * FROM LG_${config.logo.firma}_${config.logo.donem}_SLTRANS WHERE SLREF = '${seriLotId}' order by LOGICALREF DESC`;
    },
  },
  items: {
    findById: (itemId) => {
      return `SELECT * FROM LG_${config.logo.firma}_ITEMS WHERE LOGICALREF = ${itemId}`;
    },
    findByCode: (itemCode) => {
      return `SELECT LOGICALREF AS id, NAME AS name FROM LG_${config.logo.firma}_ITEMS WHERE CODE = '${itemCode}'`;
    },
    findByName: (itemCode) => {
      return `SELECT LOGICALREF AS id, NAME AS name FROM LG_${config.logo.firma}_ITEMS WHERE NAME = '${itemCode}'`;
    },
    findBySerieLotId: (seriLotId) => {
      return `SELECT ITM.LOGICALREF AS id, ITM.NAME AS name FROM LG_${config.logo.firma}_${config.logo.donem}_SLTRANS SLT JOIN LG_${config.logo.firma}_ITEMS ITM ON SLT.ITEMREF = ITM.LOGICALREF WHERE SLREF = '${seriLotId}'`;
    },
    searchByCode: (itemCode) => {
      return `SELECT LOGICALREF AS id, NAME AS name FROM LG_${config.logo.firma}_ITEMS WHERE CODE LIKE '%${itemCode}%'`;
    },
    searchByName: (itemCode) => {
      return `SELECT LOGICALREF AS id, NAME AS name FROM LG_${config.logo.firma}_ITEMS WHERE NAME LIKE '%${itemCode}%'`;
    },
    searchByCodeAndName: (text) => {
      return `SELECT LOGICALREF AS id,  NAME AS name, CODE AS code FROM LG_${config.logo.firma}_ITEMS WHERE CODE LIKE '%${text}%' OR NAME LIKE '%${text}%'`;
    },
    getItemSourceIndex: (seriLotId) => {
      return `SELECT TOP 1 SOURCEINDEX FROM LG_${config.logo.firma}_${config.logo.donem}_STLINE WHERE
      STFICHEREF = (SELECT TOP 1 STFICHEREF FROM LG_${config.logo.firma}_${config.logo.donem}_SLTRANS WHERE SLREF = '${seriLotId}' AND FICHETYPE IN (14,25) ORDER BY LOGICALREF DESC)
      AND STOCKREF = (SELECT TOP 1 ITEMREF FROM LG_${config.logo.firma}_${config.logo.donem}_SLTRANS WHERE SLREF = '${seriLotId}' AND FICHETYPE IN (14,25) ORDER BY LOGICALREF DESC)
      AND SOURCEINDEX <> 0`;
    },
  },
};
