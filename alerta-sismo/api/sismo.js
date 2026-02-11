require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const API_URL = 'https://api.gael.cloud/general/public/sismos';
// radio de alerta en km
const MAX_DISTANCE_KM = 100;

// definir la magnitud minima que se tomara en cuenta
const MIN_MAGNITUDE = 2.5;
// cada 2 minutos consulta a la api
const CHECK_INTERVAL = '*/2 * * * *';

const EMAIL_LIST = ['jignaciosalgadom@gmail.com', 'jose.salgado@rancagua.cl'];
// para evitar duplicados por fecha(cuando consulta y hay un sismo con la misma fecha que ya notifico lo omite asi no notifica lo mismo cada que consult)
let LAST_CHECKED = new Date(0);
// para evitar duplicados por sismo
const NOTIFIED_SISMOS = new Set();

// configuracion correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jose.salgado@rancagua.cl',
    pass: process.env.EMAIL_PASS || 'jdgc aqaf urgm sqpp',
  },
});

// escribir logs par seguimiento
function writeLog(message) {
  const now = new Date();
  const timestamp = now.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
  });
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
}

// generar un hash único para un sismo
function getSismoHash(sismo) {
  return `${sismo.Fecha}-${sismo.RefGeografica}`;
}

// verificar si el sismo está cerca de Collahuasi
function isSismoCercano(RefGeografica) {
  if (
    !RefGeografica ||
    typeof RefGeografica !== 'string' ||
    !RefGeografica.includes('Mina Collahuasi')
  ) {
    return false;
  }
  // extrae distancia de la string
  const match = RefGeografica.match(/(\d+)\s*km/);
  if (!match) return false;
  const distance = parseInt(match[1], 10);
  return distance <= MAX_DISTANCE_KM;
}

// para enviar correo
async function enviarAlerta(sismo) {
  const sismoHash = getSismoHash(sismo);
  if (NOTIFIED_SISMOS.has(sismoHash)) {
    writeLog(
      `Sismo ya notificado: ${sismo.Magnitud} en ${sismo.RefGeografica}`
    );
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'jose.salgado@rancagua.cl',
    to: EMAIL_LIST.join(','),
    subject: `Alerta de Sismo cerca de Collahuasi - ${sismo.Magnitud}`,
    text: `Sismo detectado:\nMagnitud: ${sismo.Magnitud}\nUbicación: ${sismo.RefGeografica}\nFecha: ${sismo.Fecha}\nProfundidad: ${sismo.Profundidad} km`,
  };

  try {
    await transporter.sendMail(mailOptions);
    NOTIFIED_SISMOS.add(sismoHash);
    const logMessage = `Correo enviado: Sismo magnitud ${sismo.Magnitud} en ${sismo.RefGeografica}`;
    console.log(logMessage);
    writeLog(logMessage);
  } catch (error) {
    const errorMessage = `Error enviando correo: ${error.message}`;
    console.error(errorMessage);
    writeLog(errorMessage);
  }
}

// funcion principal para chequear sismos
async function checkSismos() {
  try {
    const response = await axios.get(API_URL, { timeout: 10000 });
    const sismos = response.data || [];
    writeLog(`Consultada API, ${sismos.length} sismos recibidos`);

    for (const sismo of sismos) {
      const sismoDate = new Date(sismo.FechaUpdate);
      if (sismoDate > LAST_CHECKED && !isNaN(sismoDate)) {
        if (isSismoCercano(sismo.RefGeografica)) {
          if (parseFloat(sismo.Magnitud) >= MIN_MAGNITUDE) {
            await enviarAlerta(sismo);
          } else {
            writeLog(
              `Sismo descartado por baja magnitud: ${sismo.Magnitud} en ${sismo.RefGeografica}`
            );
          }
        }
      }
    }
    LAST_CHECKED = new Date();
  } catch (error) {
    const errorMessage = `Error consultando API: ${error.message}`;
    console.error(errorMessage);
    writeLog(errorMessage);
  }
}

module.exports = async (req, res) => {
  await checkSismos();
  if (res) {
    // Solo si res está definido (en Vercel)
    res.status(200).json({ status: 'OK', message: 'Chequeo completado' });
  } else {
    // Para pruebas locales
    console.log('[Local Test] Chequeo completado');
  }
};

// programar chequeo periódico
cron.schedule(CHECK_INTERVAL, checkSismos, {
  scheduled: true,
  timezone: 'America/Santiago',
});

// iniciar chequeo al arrancar
checkSismos();
