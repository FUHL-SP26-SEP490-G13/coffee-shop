const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products');
  }

  /**
   * Find product by name
   */
  async findByName(name) {
    return this.findOne({ name });
  }

  /**
   * Find product by ID with full details (sizes, images, category)
   */
  async findByIdWithDetails(id) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.image_url as category_image
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.id = ?
    `;

    const [rows] = await db.query(query, [id]);
    if (!rows[0]) return null;

    const product = rows[0];

    // Get sizes
    const [sizes] = await db.query(
      'SELECT * FROM product_sizes WHERE product_id = ? AND is_deleted = 0',
      [id]
    );
    product.sizes = sizes;

    // Get images
    const [images] = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
      [id]
    );
    product.images = images;

    return product;
  }

  /**
   * Find all products with details
   */
  async findAllWithDetails(conditions = {}, options = {}) {
    const { limit, offset } = options;
    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE 1=1
    `;

    const params = [];

    // Add conditions
    Object.keys(conditions).forEach((key) => {
      query += ` AND p.${key} = ?`;
      params.push(conditions[key]);
    });

    query += ` ORDER BY p.id DESC`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset) || 0);
    }

    const [products] = await db.query(query, params);

    // Get sizes and images for each product
    for (const product of products) {
      const [sizes] = await db.query(
        'SELECT * FROM product_sizes WHERE product_id = ? AND is_deleted = 0',
        [product.id]
      );
      product.sizes = sizes;

      const [images] = await db.query(
        'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
        [product.id]
      );
      product.images = images;
    }

    return products;
  }

  /**
   * Find products by category
   */
  async findByCategory(categoryId, options = {}) {
    const { limit, offset } = options;
    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.status = 'available'
      ORDER BY p.id DESC
    `;

    const params = [categoryId];

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset) || 0);
    }

    const [products] = await db.query(query, params);

    // Get sizes and images for each product
    for (const product of products) {
      const [sizes] = await db.query(
        'SELECT * FROM product_sizes WHERE product_id = ? AND is_deleted = 0',
        [product.id]
      );
      product.sizes = sizes;

      const [images] = await db.query(
        'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
        [product.id]
      );
      product.images = images;
    }

    return products;
  }

  /**
   * Count products by category
   */
  async countByCategory(categoryId) {
    const query = `
      SELECT COUNT(*) as total 
      FROM products 
      WHERE category_id = ? AND status = 'available'
    `;

    const [rows] = await db.query(query, [categoryId]);
    return rows[0].total;
  }

  /**
   * Search products by name
   */
  async search(keyword, options = {}) {
    const { limit = 20, offset = 0, category_id, status } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.name LIKE ?
    `;

    const params = [`%${keyword}%`];

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.query(query, params);

    // Get sizes and images for each product
    for (const product of products) {
      const [sizes] = await db.query(
        'SELECT * FROM product_sizes WHERE product_id = ? AND is_deleted = 0',
        [product.id]
      );
      product.sizes = sizes;

      const [images] = await db.query(
        'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
        [product.id]
      );
      product.images = images;
    }

    return products;
  }

  /**
   * Count search results
   */
  async countSearch(keyword, options = {}) {
    const { category_id, status } = options;

    let query = `
      SELECT COUNT(*) as total 
      FROM products 
      WHERE name LIKE ?
    `;

    const params = [`%${keyword}%`];

    if (category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = new ProductRepository();