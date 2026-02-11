const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const {
  insertarDatos,
  insertarDatosCs01Cs02Cs03,
  insertarDatosMovimin,
  deleteExcelData,
} = require('../services/dbService');

const excelDateToJSDate = (excelDate) => {
  if (excelDate == null || excelDate === '' || isNaN(excelDate)) {
    console.log('Fecha no válida o nula:', excelDate);
    return null;
  }

  const epoch = new Date(1899, 11, 30);
  const jsDate = new Date(epoch.getTime() + excelDate * 86400000);
  console.log(`📅 Fecha convertida: ${excelDate} -> ${jsDate}`);
  return jsDate;
};

const normalizeColumnNamePivote = (name) => {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/__EMPTY.*/g, '');
};

const normalizeColumnNameCS = (name) => {
  if (name.trim() === 'Fecha' || name.trim() === 'Ton') {
    return name.trim();
  }

  // Normalizar otras columnas
  return name
    .trim()
    .replace(/_1$/, '.1')
    .replace(/\s+/g, ' ')
    .replace(/__EMPTY.*/g, '');
};

const normalizeColumnNameNewData = (name) => {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/[_\s]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/[^\w_]/g, '')
    .toLowerCase()
    .replace(/^grlb_ocl_liberados$/, 'grlb_ocl')
    .replace(/^tpd_agua_$/, 'tpd_agua')
    .replace(/suma_arcillas(_\d+)?$/, (match) => {
      return match === 'suma_arcillas' ? 'suma_arcillas' : 'suma_arcillas_2';
    });
};

const normalizeDataPivote = (data) => {
  return data
    .filter((row) =>
      Object.values(row).some((value) => value !== null && value !== ''),
    )
    .map((row) => {
      let normalizedRow = {};
      for (const key in row) {
        let value = row[key];

        if (typeof value === 'number') {
          normalizedRow[normalizeColumnNamePivote(key)] = value.toFixed(4);
        } else if (value === null || value === undefined || value === '') {
          normalizedRow[normalizeColumnNamePivote(key)] = null;
        } else {
          normalizedRow[normalizeColumnNamePivote(key)] = value
            .toString()
            .trim();
        }
      }

      if (row.Fecha) {
        normalizedRow.Fecha = excelDateToJSDate(row.Fecha);
      }

      return normalizedRow;
    });
};

const normalizeDataCS = (data) => {
  return data.map((row) => {
    let normalizedRow = {};
    for (const key in row) {
      let value = row[key];
      let normalizedKey = normalizeColumnNameCS(key);

      if (key.toLowerCase().includes('fecha_1') || normalizedKey === 'fecha') {
        normalizedKey = 'Fecha';
        value = excelDateToJSDate(value);
      }

      if (typeof value === 'string' && /^\-?\d+,\d+$/.test(value)) {
        value = value.replace(',', '.');
      }

      if (typeof value === 'string' && /^\-?\d+(\.\d+)?$/.test(value)) {
        value = parseFloat(value);
      }

      if (typeof value === 'string' && value.trim() === '') {
        value = null;
      }

      normalizedRow[normalizedKey] = value;
    }

    return normalizedRow;
  });
};

const normalizeDataNew = (data) => {
  return data
    .filter((row) =>
      Object.values(row).some((value) => value !== null && value !== ''),
    )
    .map((row) => {
      let normalizedRow = {};
      for (const key in row) {
        let value = row[key];
        let normalizedKey = normalizeColumnNameNewData(key);

        if (
          key.toLowerCase().includes('fecha') ||
          normalizedKey.includes('fecha')
        ) {
          normalizedKey = 'fecha';
          value = excelDateToJSDate(value);
        }

        if (typeof value === 'string' && /^\-?\d+,\d+$/.test(value)) {
          value = value.replace(',', '.');
        }

        if (typeof value === 'string' && /^\-?\d+(\.\d+)?$/.test(value)) {
          value = parseFloat(value);
        }

        if (typeof value === 'string' && value.trim() === '') {
          value = null;
        }

        normalizedRow[normalizedKey] = value;
      }

      return normalizedRow;
    });
};

const processExcelFile = (
  buffer,
  sheetName,
  normalizer,
  startRow = 1,
  excludedColumns = [],
  maxRows = null,
) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`La hoja "${sheetName}" no existe en el archivo`);
  }

  const sheet = workbook.Sheets[sheetName];
  const range = xlsx.utils.decode_range(sheet['!ref']);

  const DM_IDX = xlsx.utils.decode_col('DM');
  const startCol = sheetName === 'CS01+CS02+CS03' ? DM_IDX : 0;

  const customRange = {
    s: { r: startRow - 1, c: startCol },
    e: { r: range.e.r, c: range.e.c },
  };

  const data = xlsx.utils.sheet_to_json(sheet, {
    raw: true,
    defval: null,
    range: customRange,
    hidden: true,
  });

  console.log(`[processExcelFile] Hoja: ${sheetName}, Range Detectado: ${sheet['!ref']}, Custom Range: StartCol=${startCol}, EndCol=${range.e.c}, Data Length: ${data.length}`);

  if (data.length === 0) {
    throw new Error(`La hoja "${sheetName}" está vacía o no tiene datos a partir de la columna ${startCol === 116 ? 'DM' : 'A'}`);
  }

  const filteredData = maxRows ? data.slice(0, maxRows) : data;

  if (sheetName === 'CS01+CS02+CS03') {
    return filteredData.map((row) => {
      const filteredRow = {};
      for (const key in row) {
        let normalizedKey = normalizer(key);

        if (normalizedKey === 'Fecha_2') normalizedKey = 'Fecha';
        if (normalizedKey === 'Ton.1') normalizedKey = 'Ton';

        if (normalizedKey === 'Fecha') {
          console.log(`Valor de fecha antes de la conversión:`, row[key]);
          row[key] = excelDateToJSDate(row[key]);
          console.log(`Fecha convertida:`, row[key]);
        }

        filteredRow[normalizedKey] = row[key];
      }
      return filteredRow;
    });
  }

  const filteredColumnsData = filteredData.map((row) => {
    const filteredRow = {};
    for (const key in row) {
      if (!excludedColumns.includes(key)) {
        const normalizedKey = normalizer(key);
        filteredRow[normalizedKey] = row[key];
      }
    }
    return filteredRow;
  });

  return sheetName === 'DATOS PIVOTE'
    ? normalizeDataPivote(filteredColumnsData)
    : filteredColumnsData;
};

const processNewExcelFile = (
  buffer,
  sheetName,
  normalizer,
  startRow = 1,
  maxRows = null,
) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`La hoja "${sheetName}" no existe en el archivo`);
  }

  const sheet = workbook.Sheets[sheetName];
  const range = xlsx.utils.decode_range(sheet['!ref']);
  const customRange = {
    s: { r: startRow - 1, c: 56 },
    e: { r: range.e.r, c: 114 },
  };

  const data = xlsx.utils.sheet_to_json(sheet, {
    raw: true,
    defval: null,
    range: customRange,
    hidden: true,
  });

  console.log(`[processNewExcelFile] Hoja: ${sheetName}, Range Detectado: ${sheet['!ref']}, Custom Range: Col 56 to 114, Data Length: ${data.length}`);

  if (data.length === 0) {
    throw new Error(`La hoja "${sheetName}" está vacía en el rango de columnas BE a DJ (56-114)`);
  }

  const limitedData = maxRows ? data.slice(0, maxRows) : data;

  const filteredData = limitedData.map((row) => {
    let filteredRow = {};
    for (const key in row) {
      const normalizedKey = normalizer(key);
      filteredRow[normalizedKey] = row[key];
    }
    return filteredRow;
  });

  console.log(
    'Columnas procesadas en processNewExcelFile:',
    Object.keys(data[0]),
  );
  return normalizeDataNew(filteredData);
};

exports.uploadExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const token = uuidv4();
  const nombreArchivo = req.file.originalname;

  try {
    const buffer = req.file.buffer;

    const dataHoja1 = processExcelFile(
      buffer,
      'DATOS PIVOTE',
      normalizeColumnNamePivote,
    );
    console.log(`Procesando DATOS PIVOTE: ${dataHoja1.length} registros`);

    let filasInsertadasPivote = 0;
    let filaError = null;

    const datosValidos = [];
    for (let i = 0; i < dataHoja1.length; i++) {
      const filaActual = dataHoja1[i];

      if (filaActual['Origen2(Rajo)'] === 'MovimientosEspeciales') {
        console.warn(
          `Fila ${i + 1
          } contiene 'MovimientosEspeciales' en 'Origen2(Rajo)'. Se detiene la inserción.`,
        );
        break;
      }

      if (!filaActual.Fecha) {
        console.warn(
          `Fila ${i + 2
          } en DATOS PIVOTE no tiene campo 'Fecha'. Proceso detenido.`,
        );
        return res.status(400).json({
          message: `Falta el campo 'Fecha' en la fila ${i + 2
            } de DATOS PIVOTE. No se insertaron datos.`,
          filaError: i + 2,
        });
      }

      filaActual.token = token;
      filaActual.nombre_archivo = nombreArchivo;

      datosValidos.push(filaActual);
    }

    await insertarDatos(datosValidos);
    filasInsertadasPivote = datosValidos.length;

    ////////////////////////////////////////////////////////////////
    // PROCESO DE LA HOJA "CS01+CS02+CS03" PARA LA TABLA PROPIA
    const excludedColumns = [
      ...Array.from({ length: 116 }, (_, i) => `Unnamed: ${i}`),
      'Unnamed: 126',
      'Unnamed: 128',
      'Unnamed: 142',
    ];
    const dataHoja2 = processExcelFile(
      buffer,
      'CS01+CS02+CS03',
      normalizeColumnNameCS,
      2,
      excludedColumns,
      31,
    );

    console.log(
      '🟢 Columnas después de normalizar CS:',
      Object.keys(dataHoja2[0]),
    );
    console.log(
      '🔍 Primeros 5 registros normalizados CS:',
      dataHoja2.slice(0, 5),
    );

    console.log(`Procesando CS01_CS02_CS03: ${dataHoja2.length} registros`);

    const dataHoja2ConCampos = dataHoja2.map((row) => ({
      ...row,
      token,
      nombre_archivo: nombreArchivo,
    }));

    await insertarDatosCs01Cs02Cs03(dataHoja2ConCampos);

    ////////////////////////////////////////////////////////////////
    // DATOS DE LA TABLA NUEVA PARA GUARDAR MOVIMIN
    const dataNuevos = processNewExcelFile(
      buffer,
      'CS01+CS02+CS03',
      normalizeColumnNameNewData,
      2,
      31,
    );

    console.log(`🚀 Procesando nuevos datos: ${dataNuevos.length} registros`);
    console.log('🔍 Primeros registros procesados:', dataNuevos.slice(0, 5));
    console.log(
      '🔍 Nombres de columnas extraídas:',
      Object.keys(dataNuevos[0]),
    );

    const dataNuevosConCampos = dataNuevos.map((row) => ({
      ...row,
      token,
      nombre_archivo: nombreArchivo,
    }));

    await insertarDatosMovimin(dataNuevosConCampos);

    let mensajeFinal = 'Datos insertados con éxito en ambas tablas';
    if (filaError) {
      mensajeFinal = `Se detuvo la inserción de DATOS PIVOTE en la fila ${filaError} debido a un campo 'Fecha' vacío. Se insertaron ${filasInsertadasPivote} de ${dataHoja1.length} filas.`;
    }

    res.status(200).json({
      // success: true,
      message: mensajeFinal,
      token,
      registrosHoja1: filasInsertadasPivote,
      registrosHoja2: dataHoja2.length,
      registrosHoja3: dataNuevos.length,
      filaError,
    });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(500).json({
      // success: false,
      message: `Error interno: ${error.message}`,
    });
  }
};

exports.deleteExcel = async (req, res) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token requerido para eliminar registros',
    });
  }
  try {
    await deleteExcelData(token);

    res.status(200).json({
      success: true,
      message: 'Registros eliminados exitosamente',
      data: [],
    });
  } catch (error) {
    console.error('Error al eliminar registros por token:', error);
    res.status(500).json({
      success: false,
      message: `Error interno: ${error.message}`,
    });
  }
};
