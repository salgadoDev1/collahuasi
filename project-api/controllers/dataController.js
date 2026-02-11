const {
  obtenerDatos,
  obtenerDatoscs,
  obtenerDatosMov,
  getUniqueFileNames,
} = require("../services/dbService");

const getData = async (req, res) => {
  try {
    const datos = await obtenerDatos();
    res.status(200).json({
      success: true,
      message: "Datos obtenidos correctamente",
      data: datos,
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los datos",
      error: error.message,
    });
  }
};

const getDatacs = async (req, res) => {
  try {
    const datos = await obtenerDatoscs();
    res.status(200).json({
      success: true,
      message: "Datos obtenidos correctamente",
      data: datos,
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los datos",
      error: error.message,
    });
  }
};

const getDataMovi = async (req, res) => {
  try {
    const datos = await obtenerDatosMov();
    res.status(200).json({
      success: true,
      message: "Datos obtenidos correctamente",
      data: datos,
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los datos",
      error: error.message,
    });
  }
};

const getNames = async (req, res) => {
  try {
    const fileNames = await getUniqueFileNames();
    res.status(200).json({
      success: true,
      message: "Nombres de archivo obtenidos correctamente",
      data: fileNames,
    });
  } catch (error) {
    console.error("Error al obtener nombres de archivo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener nombres de archivo",
      error: error.message,
    });
  }
};

module.exports = {
  getData,
  getDatacs,
  getDataMovi,
  getNames,
};
