const db = require('./src/config/database');

async function checkSchema() {
    try {
        const [rows] = await db.query('DESCRIBE receipt_settings');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkSchema();
