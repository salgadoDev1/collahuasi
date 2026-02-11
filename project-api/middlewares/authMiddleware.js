const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET no está definido en las variables de entorno");
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor: JWT_SECRET no configurado",
    });
  }

  const token =
    req.cookies.jwt || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado. Token no proporcionado.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar el token:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado. Por favor, inicia sesión nuevamente.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token inválido.",
    });
  }
};

module.exports = authMiddleware;
