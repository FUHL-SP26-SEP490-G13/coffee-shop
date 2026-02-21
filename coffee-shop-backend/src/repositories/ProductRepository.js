const db = require("../config/database");

class ProductRepository {
  async getProducts({ categoryId, keyword }) {
    let query = `
  SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    MIN(ps.price) as min_price,
    MAX(pi.image_url) as image_url
  FROM products p
  LEFT JOIN product_sizes ps 
    ON ps.product_id = p.id 
    AND ps.is_deleted = 0
  LEFT JOIN product_images pi 
    ON pi.product_id = p.id 
    AND pi.isThumbnail = 1
    AND pi.is_deleted = 0
  WHERE p.status = 'available'
`;
    const params = [];

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    if (keyword) {
      query += ` AND p.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    query += `
      GROUP BY p.id
      ORDER BY p.id DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }
}

module.exports = new ProductRepository();
