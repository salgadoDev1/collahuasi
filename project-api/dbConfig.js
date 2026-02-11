const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,

  requestTimeout: 120000, // 120 seconds
  connectionTimeout: 60000, // 60 seconds

  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

async function connectToDatabase() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig)
      .then(pool => {
        console.log('Conexión exitosa a la base de datos');
        return pool;
      })
      .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
        poolPromise = null; // Reset promise on error to allow retry
        throw err;
      });
  }
  return poolPromise;
}

module.exports = {
  connectToDatabase,
  sql,
};
