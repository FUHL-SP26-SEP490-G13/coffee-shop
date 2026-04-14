const repo = require('./src/repositories/CashSessionRepository');
const service = require('./src/services/CashSessionService');

async function test() {
  try {
    const pool = require('./src/config/database');
    const [users] = await pool.query("SELECT id FROM users WHERE last_name LIKE '%Khai%'");
    if(users && users.length){
        const userId = users[0].id;
        console.log("Testing open with USER_ID:", userId);
        const res = await service.openSession(userId, 100000);
        console.log('Opened successfully:', res);
    }
  } catch(e) {
    console.log('Error thrown:', e);
  }
  process.exit(0);
}
test();
