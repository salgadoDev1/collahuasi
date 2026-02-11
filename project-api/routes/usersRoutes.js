const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rutas públicas
router.post("/login", userController.login);
// router.post("/verify-otp", userController.verifyOTP);
router.post("/auth/recover-password", userController.recoverPassword);
router.post("/auth/reset-password", userController.resetPassword);

// Rutas protegidas
router.post("/create", authMiddleware, userController.createUser);
router.put("/update/:id", authMiddleware, userController.updateUser);
router.delete("/delete/:id", authMiddleware, userController.deleteUser);
router.get("/get-data-user", authMiddleware, userController.getUser);
router.post("/logout", authMiddleware, userController.logout);

module.exports = router;
