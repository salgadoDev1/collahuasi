const express = require("express");
const router = express.Router();
const datosMovimientosController = require("../controllers/datosMovimientosController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/add-column",
  authMiddleware,
  datosMovimientosController.addColumn
);

router.get(
  "/get-columns",
  authMiddleware,
  datosMovimientosController.getColumns
);

router.get("/reporte1", authMiddleware, datosMovimientosController.reporte1);

router.get("/reporte2", authMiddleware, datosMovimientosController.reporte2);

router.get(
  "/reporte-mina-vs-planta",
  authMiddleware,
  datosMovimientosController.reporteMinaVsPlanta
);

router.get(
  "/origenes",
  authMiddleware,
  datosMovimientosController.getOrigenesController
);
router.get(
  "/destinos",
  authMiddleware,
  datosMovimientosController.getDestinosController
);
router.get(
  "/materiales",
  authMiddleware,
  datosMovimientosController.getMaterialesController
);
router.get(
  "/fases",
  authMiddleware,
  datosMovimientosController.getFaseController
);

module.exports = router;
