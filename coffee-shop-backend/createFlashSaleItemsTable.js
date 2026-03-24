require("dotenv").config();
const db = require("./src/config/database");

async function run() {
  try {
    const createItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS flash_sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flash_sale_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uq_flash_sale_product (flash_sale_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await db.query(createItemsTableQuery);
    console.log("Created table flash_sale_items successfully.");
    
    // Get the first active flash sale to seed items
    const [sales] = await db.query("SELECT id FROM flash_sales LIMIT 1");
    if (sales.length > 0) {
       const flashSaleId = sales[0].id;
       // Get top 4 active products to add to this flash sale
       const [products] = await db.query("SELECT id FROM products WHERE is_deleted = 0 LIMIT 4");
       
       for (const p of products) {
         await db.query(`
           INSERT IGNORE INTO flash_sale_items (flash_sale_id, product_id)
           VALUES (?, ?)
         `, [flashSaleId, p.id]);
       }
       console.log("Seeded 4 products into the active flash sale.");
    }
  } catch (err) {
    console.error("Database Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
