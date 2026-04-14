// file: test_cron.js
require('dotenv').config();
const db = require('./src/config/database');
const AttendanceService = require('./src/services/AttendanceService');

async function run() {
    console.log('--- BAT DAU QUET CRONJOB ---');
    try {
        const rs = await AttendanceService.executeAutoCronLogic();
        console.log('KET QUA QUET:', rs);
    } catch (error) {
        console.log('LOI:', error);
    }
    process.exit();
}
run();
