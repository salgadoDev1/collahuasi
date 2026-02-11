const jwt = require('jsonwebtoken');
// const speakeasy = require('speakeasy');
// const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// const ActiveDirectory = require('activedirectory2');

const {
  createUserInDB,
  updateUserInDB,
  deleteUserInDB,
  createAuthForUserInDB,
  getUserInDB,
  getUserById,
  updateLoginTime,
  getAuthByEmail,
  updateRecoveryToken,
  validateRecoveryToken,
  updatePassword,
  // update2FAInDB,
} = require('../services/dbService');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configuración del servidor LDAP
/*
const ad = new ActiveDirectory({
  url: 'ldap://localhost:389',
  baseDN: 'dc=example,dc=org',
  username: 'cn=admin,dc=example,dc=org',
  password: 'admin',
});
*/

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email y contraseña son requeridos" });
  }
  try {
    const authData = await getAuthByEmail(email);

    if (!authData) {
      console.log("No se encontró registro de Auth para:", email);
      return res.status(404).json({ message: "Credenciales incorrectas" });
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + authData.salt)
      .digest("hex");

    if (hashedPassword !== authData.password) {
      console.log("Password no coincide para:", email);
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = await getUserById(authData.fk_usuario_id);

    if (!user) {
      console.log("No se encontró el usuario asociado en Usuarios para el id:", authData.fk_usuario_id);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("Usuario autenticado correctamente:", user.email);

    await updateLoginTime(authData.fk_usuario_id);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        perfil: user.perfil,
      },
      process.env.JWT_SECRET || "mi_secreto_jwt",
      { expiresIn: "1h" }
    );

    console.log("Token generado con éxito");

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000,
    });

    console.log("Cookie JWT establecida en la respuesta");

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        perfil: user.perfil,
      },
    });
  } catch (error) {
    console.error("Error crítico en el login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const createUser = async (req, res) => {
  try {
    const { nombre, email, perfil } = req.body;

    // Crear usuario y obtener el ID generado
    const userId = await createUserInDB(nombre, email, perfil);

    if (!userId) {
      throw new Error("No se pudo obtener el ID del usuario recién creado");
    }

    console.log("ID del usuario creado:", userId);

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto
      .createHash("sha256")
      .update("defaultPassword" + salt)
      .digest("hex");

    const username = email.split('@')[0];

    await createAuthForUserInDB({
      fk_usuario_id: userId,
      user: username,
      password: hashedPassword,
      salt,
      ultimo_login: null,
      intentos_fallidos: 0,
      bloqueado: false,
      token_recuperacion: null,
      fecha_token: null,
    });

    res.status(201).json({
      success: true,
      message: "Usuario y autenticación creados correctamente",
      data: {
        userId,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error al crear usuario",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, estado, perfil } = req.body;

    if (!id) {
      throw new Error("El ID del usuario es obligatorio");
    }

    const updatedUser = await updateUserInDB(id, {
      nombre,
      email,
      estado,
      perfil,
    });

    res.status(200).json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar usuario",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteUserInDB(id);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente (estado cambiado)',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error al eliminar usuario' });
  }
};

const getUser = async (req, res) => {
  try {
    const datos = await getUserInDB();
    res.status(200).json({
      success: true,
      message: 'Datos obtenidos correctamente',
      data: datos,
    });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

const recoverPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email es requerido" });
  }

  try {
    const userAuth = await getAuthByEmail(email);
    if (!userAuth) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const fechaToken = new Date();

    await updateRecoveryToken(userAuth.fk_usuario_id, token, fechaToken);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const resetLink = `${process.env.CLIENT_ORIGIN}/#/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Recuperación de contraseña",
      html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                  <h2 style="text-align: center; color: #007bff;">Recuperación de contraseña</h2>
                  <p>Hola,</p>
                  <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este mensaje.</p>
                  <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                  <div style="text-align: center; margin: 20px;">
                    <a href="${resetLink}" 
                      style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                      Restablecer contraseña
                    </a>
                  </div>
                  <p>O copia y pega el siguiente enlace en tu navegador:</p>
                  <p style="word-wrap: break-word; text-align: center;">${resetLink}</p>
                  <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    Este correo fue enviado automáticamente, por favor no respondas.
                  </p>
                </div>
              </div>
            `,
    });

    res.status(200).json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Token y nueva contraseña son requeridos' });
  }

  try {
    const tokenData = await validateRecoveryToken(token);

    if (!tokenData) {
      return res.status(404).json({ message: 'Token no válido' });
    }

    const { fk_usuario_id, fecha_token } = tokenData;
    const tokenFecha = new Date(fecha_token);
    const ahora = new Date();

    if (ahora - tokenFecha > 30 * 60 * 1000) {
      return res.status(400).json({ message: 'El token ha expirado' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto
      .createHash('sha256')
      .update(newPassword + salt)
      .digest('hex');

    await updatePassword(fk_usuario_id, hashedPassword, salt);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res
    .status(200)
    .json({ success: true, message: "Sesión cerrada correctamente" });
};

// 2FA related functions commented out
/*
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email y OTP son requeridos' });
    }

    const userAuth = await getAuthByEmail(email);
    if (!userAuth || !userAuth.totp_secret) {
      return res
        .status(404)
        .json({ message: 'Usuario o secreto TOTP no encontrado' });
    }

    // Verificar OTP
    const isValid = speakeasy.totp.verify({
      secret: userAuth.totp_secret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!isValid) {
      return res.status(401).json({ message: 'OTP inválido' });
    }

    // Habilitar 2FA si no está habilitado
    if (!userAuth.totp_enabled) {
      await update2FAInDB(userAuth.fk_usuario_id, userAuth.totp_secret, true);
    }

    // Generar token JWT
    const username = email.split('@')[0];
    const token = jwt.sign(
      {
        email: email,
        username: username,
        nombre: username,
        perfil: 1,
      },
      process.env.JWT_SECRET || 'mi_secreto_jwt',
      { expiresIn: '1h' },
    );

    // Enviar cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false, // Cambia a true en producción
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: userAuth.totp_enabled
        ? 'OTP verificado, inicio de sesión exitoso'
        : '2FA habilitado e inicio de sesión exitoso',
      user: {
        email: email,
        nombre: username,
        perfil: 1,
      },
    });
  } catch (error) {
    console.error('Error al verificar OTP:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const regenerateQR = async (req, res) => {
  try {
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const userAuth = await getAuthByEmail(email);
    if (!userAuth) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const secret = speakeasy.generateSecret({
      name: `TuApp:${email}`,
      issuer: 'TuApp',
    });

    await update2FAInDB(userAuth.fk_usuario_id, secret.base32, false);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      message: 'Nuevo QR generado. Escanea el QR y verifica el OTP.',
      data: {
        qrCode: qrCodeUrl,
      },
    });
  } catch (error) {
    console.error('Error al regenerar QR:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
*/

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  login,
  logout,
  recoverPassword,
  resetPassword,
};
