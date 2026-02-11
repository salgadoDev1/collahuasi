require("dotenv").config();
const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const cheerio = require("cheerio");

const SCRAPING_URL = "https://www.sismologia.cl/";
const MAX_DISTANCE_KM = 300;
const MIN_MAGNITUDE = 3.0;
const CHECK_INTERVAL = "*/2 * * * *";
const EMAIL_LIST = [
  "jignaciosalgadom@gmail.com",
  "brivera@dares.tech",
  "rgodoy@dares.tech",
  "rasilva@collahuasi.cl",
  "pcampana@collahuasi.cl",
];
const START_TIME = Date.now();
let NOTIFIED_SISMOS = new Set();

const transporter = nodemailer.createTransport({
  service: "Outlook365",
  auth: {
    user: process.env.EMAIL_USER || "tim@dares.tech",
    pass: process.env.EMAIL_PASS || "X!021977210083ax",
  },
});

function writeLog(message) {
  const now = new Date();
  const timestamp = now.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
}

function getSismoHash(sismo) {
  return `${sismo.Fecha}-${sismo.RefGeografica}`;
}

function isSismoCercano(RefGeografica) {
  if (
    !RefGeografica ||
    typeof RefGeografica !== "string" ||
    !RefGeografica.includes("Mina Collahuasi")
  )
    return false;
  const match = RefGeografica.match(/(\d+)\s*km/);
  if (!match) return false;
  const distance = parseInt(match[1], 10);
  return distance <= MAX_DISTANCE_KM;
}

async function enviarAlerta(sismo) {
  const sismoHash = getSismoHash(sismo);
  if (NOTIFIED_SISMOS.has(sismoHash)) {
    writeLog(
      `Sismo ya notificado: ${sismo.Magnitud} en ${sismo.RefGeografica}`
    );
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || "tim@dares.tech",
    to: EMAIL_LIST.join(","),
    subject: `Alerta de Sismo cerca de Collahuasi - ${sismo.Magnitud}`,
    text: `Sismo detectado:\nMagnitud: ${sismo.Magnitud}\nUbicación: ${sismo.RefGeografica}\nFecha: ${sismo.Fecha}\nProfundidad: ${sismo.Profundidad} km`,
  };

  try {
    await transporter.sendMail(mailOptions);
    NOTIFIED_SISMOS.add(sismoHash);
    writeLog(
      `Correo enviado: Sismo magnitud ${sismo.Magnitud} en ${sismo.RefGeografica}`
    );
  } catch (error) {
    writeLog(`Error enviando correo: ${error.message}`);
  }
}

async function checkSismos() {
  try {
    const response = await axios.get(SCRAPING_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const sismos = [];

    // scraping de la tabla de ultimos sismos
    $("tbody tr").each(function () {
      const $row = $(this);
      const $firstTd = $row.find("td:first-child");

      const fechaText = $firstTd.find("a").text().trim();
      const fullText = $firstTd.text().trim();
      const refGeografica = fullText
        .replace(fechaText, "")
        .replace(/[\n\s]+/g, " ")
        .trim();

      const profundidadText = $row
        .find("td:nth-child(2)")
        .text()
        .trim()
        .replace(" km", "");
      const magnitudText = $row.find("td:nth-child(3)").text().trim();

      const sismo = {
        Fecha: fechaText,
        Magnitud: parseFloat(magnitudText),
        RefGeografica: refGeografica,
        Profundidad: parseInt(profundidadText, 10),
      };

      if (!isNaN(sismo.Magnitud) && !isNaN(sismo.Profundidad)) {
        sismos.push(sismo);
      }
    });

    writeLog(`Scraping completado, ${sismos.length} sismos extraídos`);

    for (const sismo of sismos) {
      // Parsing explícito con offset chileno (octubre: UTC-3)
      const fechaLocal = sismo.Fecha + " -03:00";
      const sismoDate = new Date(fechaLocal);

      const startTimeThreshold = new Date(START_TIME);
      if (
        sismoDate > startTimeThreshold &&
        !isNaN(sismoDate.getTime()) &&
        !NOTIFIED_SISMOS.has(getSismoHash(sismo))
      ) {
        if (isSismoCercano(sismo.RefGeografica)) {
          if (parseFloat(sismo.Magnitud) >= MIN_MAGNITUDE) {
            await enviarAlerta(sismo);
          } else {
            writeLog(
              `Sismo descartado por baja magnitud: ${sismo.Magnitud} en ${sismo.RefGeografica}`
            );
          }
        }
      } else if (isSismoCercano(sismo.RefGeografica)) {
        writeLog(
          `Sismo descartado por antigüedad: ${sismo.Magnitud} en ${
            sismo.RefGeografica
          } (fecha original: ${
            sismo.Fecha
          }, parseada local: ${sismoDate.toLocaleString("es-CL", {
            timeZone: "America/Santiago",
          })})`
        );
      }
    }
  } catch (error) {
    writeLog(`Error en scraping: ${error.message}`);
  }
}

cron.schedule(CHECK_INTERVAL, checkSismos, {
  scheduled: true,
  timezone: "America/Santiago",
});
checkSismos();
