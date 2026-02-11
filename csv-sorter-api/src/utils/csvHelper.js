// utils/csvHelper.js
const moment = require("moment");

/**
 * Procesa y ordena los datos de un CSV en base a una columna de fecha.
 * @param {Array<Object>} rawData - Arreglo de objetos con los datos CSV
 * @param {string} fechaColumna - Nombre de la columna a usar para ordenar
 * @returns {Array<Object>} - Datos ordenados por fecha
 */
const processAndSortCsv = (rawData, fechaColumna = "PP1-PCV Fecha") => {
  const dataConFechaValida = rawData.filter((row) => {
    const fechaStr = row[fechaColumna]?.trim();
    return (
      fechaStr &&
      (moment(fechaStr, moment.ISO_8601, true).isValid() ||
        moment(fechaStr, "DD/MM/YYYY HH:mm", true).isValid() ||
        moment(fechaStr, "D/M/YYYY H:mm", true).isValid())
    );
  });

  const dataOrdenada = dataConFechaValida.sort((a, b) => {
    const fechaA = new Date(a[fechaColumna]);
    const fechaB = new Date(b[fechaColumna]);
    return fechaA - fechaB;
  });

  return dataOrdenada;
};

module.exports = { processAndSortCsv };
