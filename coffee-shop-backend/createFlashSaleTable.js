require("dotenv").config();
const db = require("./src/config/database");

async function run() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS flash_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        discount_percent INT NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_deleted TINYINT(1) DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await db.query(createTableQuery);
    console.log("Created table flash_sales successfully.");
    
    // Check if table is empty, if so, seed one active flash sale for testing
    const [rows] = await db.query("SELECT COUNT(*) as count FROM flash_sales");
    if (rows[0].count === 0) {
       // Insert a flash sale that is currently active (e.g. valid for the next 24 hours)
       await db.query(`
         INSERT INTO flash_sales (title, start_time, end_time, discount_percent, status)
         VALUES (
            'Giờ Vàng Giá Sốc', 
            DATE_SUB(NOW(), INTERVAL 1 HOUR), 
            DATE_ADD(NOW(), INTERVAL 5 HOUR), 
            20, 
            'active'
         )
       `);
       console.log("Seeded initial active flash sale (20%).");
    }
  } catch (err) {
    console.error("Database Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
