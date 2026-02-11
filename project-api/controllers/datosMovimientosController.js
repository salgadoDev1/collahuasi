const dbService = require("../services/dbService");

const addColumn = async (req, res) => {
  const { columnName, columnType } = req.body;
  if (!columnName || !columnType) {
    return res
      .status(400)
      .json({ message: "Nombre de la columna y tipo de dato son requeridos" });
  }
  try {
    await dbService.addColumnToDatosMovimientos(columnName, columnType);
    res.status(200).json({
      success: true,
      message: `Columna '${columnName}' agregada exitosamente`,
    });
  } catch (error) {
    console.error("Error al agregar columna:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getColumns = async (req, res) => {
  try {
    const columns = await dbService.getTableColumns();
    res.status(200).json({ success: true, columns });
  } catch (error) {
    console.error("Error al obtener las columnas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const reporte1 = async (req, res, next) => {
  const { origen, destino, material, fase } = req.query;
  console.log("Parámetros recibidos en reporte1:", {
    origen,
    destino,
    material,
    fase,
  });
  try {
    const data = await dbService.getReporte1(
      origen || "",
      destino || "",
      material || "",
      fase || ""
    );
    console.log("Datos devueltos por getReporte1:", data);
    res.status(200).json({
      success: true,
      message: "Datos del reporte 1 obtenidos correctamente",
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

const reporte2 = async (req, res, next) => {
  const { año, mes, origen, destino, material, fase } = req.query;
  try {
    const data = await dbService.getReporte2(
      parseInt(año),
      parseInt(mes),
      origen || "",
      destino || "",
      material || "",
      fase || ""
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const reporteMinaVsPlanta = async (req, res, next) => {
  const { año, mes } = req.query;
  if (!año || !mes) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan parámetros 'año' o 'mes'" });
  }
  try {
    const data = await dbService.getReporteMinaVsPlanta(año, mes);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getOrigenesController = async (req, res) => {
  try {
    const origenes = await dbService.getOrigenes();
    res.status(200).json({
      success: true,
      message: "Orígenes obtenidos correctamente",
      data: origenes,
    });
  } catch (error) {
    console.error("Error al obtener orígenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los orígenes",
      error: error.message,
    });
  }
};
const getDestinosController = async (req, res) => {
  try {
    const origenes = await dbService.getDestinos();
    res.status(200).json({
      success: true,
      message: "destinos obtenidos correctamente",
      data: origenes,
    });
  } catch (error) {
    console.error("Error al obtener destinos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los destinos",
      error: error.message,
    });
  }
};

const getMaterialesController = async (req, res) => {
  try {
    const origenes = await dbService.getMateriales();
    res.status(200).json({
      success: true,
      message: "materiales obtenidos correctamente",
      data: origenes,
    });
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los materiales",
      error: error.message,
    });
  }
};

const getFaseController = async (req, res) => {
  try {
    const fase = await dbService.getFase();
    res.status(200).json({
      success: true,
      message: "La fase se obtenida correctamente",
      data: fase,
    });
  } catch (error) {
    console.error("Error al obtener la fase:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la fase",
      error: error.message,
    });
  }
};

module.exports = {
  addColumn,
  getColumns,
  reporte1,
  reporte2,
  reporteMinaVsPlanta,
  getOrigenesController,
  getDestinosController,
  getMaterialesController,
  getFaseController,
};
