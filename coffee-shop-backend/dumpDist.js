const fs = require('fs');
const pool = require('./src/config/database');

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM discount');
    fs.writeFileSync('discounts_dump.json', JSON.stringify(rows, null, 2));
    console.log('Dumped to discounts_dump.json');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
