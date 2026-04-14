const pool = require('../src/config/database');

async function run() {
  try {
    await pool.query('ALTER TABLE attendance_settings DROP COLUMN early_checkout_before_minutes;');
    console.log('Successfully dropped early_checkout_before_minutes column from attendance_settings table.');
  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('Column early_checkout_before_minutes does not exist. Skipping.');
    } else {
      console.error('Error dropping early_checkout_before_minutes:', error);
    }
  } finally {
    process.exit(0);
  }
}

run();
