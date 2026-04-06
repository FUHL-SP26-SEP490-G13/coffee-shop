require('dotenv').config();
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

const dropFavorites = async () => {
  const pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
  });

  try {
    console.log('Dropping favorites table...');
    await pool.query('DROP TABLE IF EXISTS favorites;');
    console.log('Favorites table dropped successfully!');
  } catch (err) {
    console.error('Error dropping favorites table:', err);
  } finally {
    await pool.end();
  }
};

dropFavorites();
