const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middlewares/authMiddleware');

require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://collahuasidash.vercel.app',
  'https://collahuasi-dashboard-five.vercel.app',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir si no hay origen (como en Postman) o si está en la lista blanca
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.warn('Bloqueado por CORS:', origin);
        callback(null, false); // No tirar error, solo no permitirlo
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  }),
);

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

if (process.env.DISABLE_CSRF !== 'true') {
  const csrfProtection = csrf({
    cookie: {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    },
  });
  app.use(csrfProtection);

  app.get('/api/csrf-token', (req, res) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    });
    res.status(200).json({ success: true });
  });
} else {
  app.get('/api/csrf-token', (req, res) => {
    res.status(200).json({ success: true, message: 'CSRF disabled' });
  });
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de login',
  },
});
app.use('/api/login', loginLimiter);

// Ruta para obtener datos del usuario autenticado (usando JWT, sin DB)
app.get('/api/me', authMiddleware, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        email: req.user.email,
        nombre: req.user.nombre,
        perfil: req.user.perfil,
      },
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

// Ruta para logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  res.status(200).json({ success: true, message: 'Sesión cerrada' });
});

const excelRoutes = require('./routes/excelRoutes');
const usersRoutes = require('./routes/usersRoutes');
const datosMovimientosRoutes = require('./routes/datosMovimientosRoutes');

app.use('/api', excelRoutes);
app.use('/api', usersRoutes);
app.use('/api', datosMovimientosRoutes);

module.exports = app;
