const pool = require("../config/database");

class CartRepository {
  async findCartByUserId(userId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id FROM carts WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  async createCart(userId, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO carts (user_id) VALUES (?)`,
      [userId]
    );
    return result.insertId;
  }

  async deleteCartItems(cartId, connection = pool) {
    await connection.query(`DELETE FROM cart_items WHERE cart_id = ?`, [
      cartId,
    ]);
  }

  async insertCartItem(data, connection = pool) {
    const [result] = await connection.query(
      `
      INSERT INTO cart_items (
        cart_id,
        product_size_id,
        quantity,
        base_price,
        saved_for_later
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.cart_id,
        data.product_size_id,
        data.quantity,
        data.base_price,
        data.saved_for_later,
      ]
    );

    return result.insertId;
  }

  async insertCartItemTopping(data, connection = pool) {
    await connection.query(
      `
      INSERT INTO cart_item_toppings (
        cart_item_id,
        topping_id,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?)
      `,
      [data.cart_item_id, data.topping_id, data.quantity, data.price]
    );
  }

  async findProductSizeById(productSizeId, connection = pool) {
    const [rows] = await connection.query(
      `
      SELECT
        ps.id,
        ps.product_id,
        ps.size,
        ps.price AS default_price,
        p.name,
        p.slug,
        p.status,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_deleted = 0
          ORDER BY pi.isThumbnail DESC, pi.id ASC
          LIMIT 1
        ) AS image
      FROM product_sizes ps
      JOIN products p ON p.id = ps.product_id
      WHERE ps.id = ? AND ps.is_deleted = 0 AND p.is_deleted = 0
      LIMIT 1
      `,
      [productSizeId]
    );

    return rows[0] || null;
  }

  async findToppingById(toppingId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, name, price FROM toppings WHERE id = ? AND is_deleted = 0 LIMIT 1`,
      [toppingId]
    );

    return rows[0] || null;
  }

  async findCartItemsByCartId(cartId, connection = pool) {
    const [rows] = await connection.query(
      `
      SELECT
        ci.id,
        ci.cart_id,
        ci.product_size_id,
        ci.quantity,
        ci.base_price,
        ci.saved_for_later,
        ps.size,
        p.id AS product_id,
        p.name,
        p.slug,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_deleted = 0
          ORDER BY pi.isThumbnail DESC, pi.id ASC
          LIMIT 1
        ) AS image
      FROM cart_items ci
      JOIN product_sizes ps ON ps.id = ci.product_size_id
      JOIN products p ON p.id = ps.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.id ASC
      `,
      [cartId]
    );

    return rows;
  }

  async findToppingsByCartItemIds(itemIds, connection = pool) {
    if (!itemIds.length) return [];

    const [rows] = await connection.query(
      `
      SELECT
        cit.cart_item_id,
        cit.topping_id,
        cit.quantity,
        cit.price,
        t.name
      FROM cart_item_toppings cit
      JOIN toppings t ON t.id = cit.topping_id
      WHERE cit.cart_item_id IN (?)
      ORDER BY cit.id ASC
      `,
      [itemIds]
    );

    return rows;
  }
}

module.exports = new CartRepository();
