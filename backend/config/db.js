const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hms_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper for running queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'hms_db'));
    connection.release();
    return true;
  } catch (error) {
    console.error(' MySQL Connection Error:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
