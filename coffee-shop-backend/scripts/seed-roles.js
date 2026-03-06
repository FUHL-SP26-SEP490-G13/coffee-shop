const mysql = require('mysql2/promise');
require('dotenv').config();

const { ROLES } = require('../src/config/constants');

async function seedRoles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('🌱 Starting database seeding...');

    // Role definitions from constants
    const roles = [
      { id: ROLES.MANAGER, name: 'Manager' },
      { id: ROLES.STAFF, name: 'Staff' },
      { id: ROLES.BARISTA, name: 'Barista' },
      { id: ROLES.CUSTOMER, name: 'Customer' }
    ];

    for (const role of roles) {
      // Check if role exists
      const [rows] = await connection.query('SELECT * FROM role WHERE id = ?', [role.id]);
      
      if (rows.length === 0) {
        await connection.query('INSERT INTO role (id, role_name) VALUES (?, ?)', [role.id, role.name]);
        console.log(`✅ Inserted role: ${role.name} (ID: ${role.id})`);
      } else {
        console.log(`ℹ️ Role already exists: ${role.name} (ID: ${role.id})`);
      }
    }

    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await connection.end();
  }
}

seedRoles();
