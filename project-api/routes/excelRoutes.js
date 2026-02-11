const express = require("express");
const router = express.Router();
const upload = require("../services/multerConfig");
const excelController = require("../controllers/excelController");
const dataController = require("../controllers/dataController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/upload-excel",
  upload.single("file"),
  authMiddleware,
  excelController.uploadExcel
);

router.get("/file-names", authMiddleware, dataController.getNames);
router.delete(
  "/delete-excel/:token",
  authMiddleware,
  excelController.deleteExcel
);

router.get("/get-data", authMiddleware, dataController.getData);
router.get("/get-data-cs", authMiddleware, dataController.getDatacs);
router.get("/get-data-mv", authMiddleware, dataController.getDataMovi);

module.exports = router;
