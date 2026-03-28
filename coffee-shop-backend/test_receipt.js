const TakeawayRepository = require('./src/repositories/TakeawayRepository');
const db = require('./src/config/database');

async function test() {
  try {
    const [[order]] = await db.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
    if (!order) {
      console.log('No orders found in db');
      process.exit(0);
    }
    console.log('Testing order ID:', order.id);
    
    // We run the raw query to see exactly what toppings_raw looks like
    const [rows] = await db.query(
      `SELECT od.id, p.name AS product_name, ps.size,
              od.quantity, od.price, od.note,
              JSON_ARRAYAGG(
                IF(t.id IS NULL, NULL,
                   JSON_OBJECT('topping_id', t.id, 'name', t.name,
                               'quantity', odt.quantity, 'price', odt.price))
              ) AS toppings_raw
       FROM order_details od
       INNER JOIN product_sizes ps ON od.product_size_id = ps.id
       INNER JOIN products p ON ps.product_id = p.id
       LEFT JOIN order_detail_toppings odt ON odt.order_detail_id = od.id
       LEFT JOIN toppings t ON odt.topping_id = t.id
       WHERE od.order_id = ?
       GROUP BY od.id, p.name, ps.size, od.quantity, od.price, od.note`,
      [order.id]
    );
    
    console.log("RAW ROWS:");
    console.dir(rows, { depth: null });

    for (const row of rows) {
      console.log(`Row ${row.id} toppings_raw:`, JSON.stringify(row.toppings_raw));
      console.log(`Type:`, typeof row.toppings_raw);
      try {
        JSON.parse(row.toppings_raw || '[]');
      } catch (e) {
        console.error("PARSE FAILED FOR:", row.toppings_raw);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('ERROR getting receipt:', err);
    process.exit(1);
  }
}

test();
