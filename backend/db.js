require('dotenv').config(); 
// Import library mysql2
const mysql = require('mysql2');

// Buat "connection pool"
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ekspor "promise" dari pool agar bisa kita gunakan di file lain
module.exports = pool.promise();