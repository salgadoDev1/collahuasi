require('dotenv').config();
const express = require('express');
const { connectToDatabase } = require('./dbConfig');
const app = require('./app');

connectToDatabase();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
