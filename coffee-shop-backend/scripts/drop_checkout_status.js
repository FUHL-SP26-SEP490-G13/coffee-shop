const pool = require('../src/config/database');

async function run() {
  try {
    await pool.query('ALTER TABLE attendances DROP COLUMN checkout_status;');
    console.log('Successfully dropped checkout_status column from attendances table.');
  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('Column checkout_status does not exist. Skipping.');
    } else {
      console.error('Error dropping checkout_status:', error);
    }
  } finally {
    process.exit(0);
  }
}

run();
