const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,

  requestTimeout: 60000,

  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log('Conexión exitosa a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  sql,
};
