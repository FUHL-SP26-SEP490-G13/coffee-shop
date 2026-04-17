const mysql = require('mysql2/promise');
const env = require('./src/config/env');

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  timezone: '+07:00',
});

// For mysql2/promise, pool.on exists!
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00';");
});

async function test() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        @@session.time_zone as tz,
        CURTIME() as curr_time,
        SUBTIME('18:00:00', '00:30:00') as sub_time,
        (CURTIME() BETWEEN SUBTIME('18:00:00', '00:30:00') AND '23:00:00') as is_between
    `);
    console.log("SQL Test:", rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}
test();
