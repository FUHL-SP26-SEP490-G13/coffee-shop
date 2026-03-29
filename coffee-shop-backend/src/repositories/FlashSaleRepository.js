const db = require("../config/database");

class FlashSaleRepository {
  async findCurrentActive() {
    const [rows] = await db.query(
      `
      SELECT * FROM flash_sales 
      WHERE is_deleted = 0 
        AND status = 'active'
        AND NOW() BETWEEN start_time AND end_time
      ORDER BY end_time ASC
      LIMIT 1
      `
    );
    
    if (!rows[0]) return null;
    
    const activeSale = rows[0];
    
    const [items] = await db.query(
      `SELECT product_id FROM flash_sale_items WHERE flash_sale_id = ?`,
      [activeSale.id]
    );
    
    activeSale.product_ids = items.map(item => item.product_id);
    
    return activeSale;
  }

  // Helper method check trùng khung giờ
  async checkOverlap(startTime, endTime, excludeId = null) {
    let query = `
      SELECT id, title, start_time, end_time FROM flash_sales 
      WHERE is_deleted = 0 
        AND status = 'active'
        AND (? < end_time AND ? > start_time)
    `;
    const params = [startTime, endTime];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    query += ` LIMIT 1`;
    
    const [rows] = await db.query(query, params);
    return rows[0] || null;
  }

  async findAll() {
    const [rows] = await db.query(
      `SELECT * FROM flash_sales WHERE is_deleted = 0 ORDER BY created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM flash_sales WHERE id = ? AND is_deleted = 0 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    
    const sale = rows[0];
    const [items] = await db.query(
      `SELECT product_id FROM flash_sale_items WHERE flash_sale_id = ?`,
      [id]
    );
    sale.product_ids = items.map(item => item.product_id);
    return sale;
  }

  async create(data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO flash_sales (title, start_time, end_time, discount_percent, status) VALUES (?, ?, ?, ?, ?)`,
        [data.title, data.start_time, data.end_time, data.discount_percent, data.status || 'active']
      );
      
      const newId = result.insertId;
      
      if (data.productIds && data.productIds.length > 0) {
        const values = data.productIds.map(pid => [newId, pid]);
        await connection.query(
          `INSERT INTO flash_sale_items (flash_sale_id, product_id) VALUES ?`,
          [values]
        );
      }
      
      await connection.commit();
      return newId;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }

  async update(id, data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(
        `UPDATE flash_sales SET title = ?, start_time = ?, end_time = ?, discount_percent = ?, status = ? WHERE id = ? AND is_deleted = 0`,
        [data.title, data.start_time, data.end_time, data.discount_percent, data.status, id]
      );
      
      if (data.productIds && Array.isArray(data.productIds)) {
        await connection.query(`DELETE FROM flash_sale_items WHERE flash_sale_id = ?`, [id]);
        
        if (data.productIds.length > 0) {
          const values = data.productIds.map(pid => [id, pid]);
          await connection.query(
            `INSERT INTO flash_sale_items (flash_sale_id, product_id) VALUES ?`,
            [values]
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const [result] = await db.query(
      `UPDATE flash_sales SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new FlashSaleRepository();
