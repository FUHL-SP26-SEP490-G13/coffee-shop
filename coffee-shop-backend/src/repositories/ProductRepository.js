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
    const [products] = await db.query(
      `
  SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.category_id,
    c.name AS category_name
  FROM products p
  LEFT JOIN category c ON p.category_id = c.id
  WHERE p.id = ?
  LIMIT 1
  `,
      [id],
    );

    if (products.length === 0) return null;

    const product = products[0];

    const [images] = await db.query(
      `
    SELECT id, image_url, isThumbnail
    FROM product_images
    WHERE product_id = ? AND is_deleted = 0
    ORDER BY isThumbnail DESC
    `,
      [id],
    );

    const [sizes] = await db.query(
      `
    SELECT id, size, price
    FROM product_sizes
    WHERE product_id = ? AND is_deleted = 0
    `,
      [id],
    );

    return {
      ...product,
      images,
      sizes,
    };
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

    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);

    // ===== LẤY ALL SIZES 1 LẦN =====
    const [sizes] = await db.query(
      `SELECT * FROM product_sizes 
     WHERE product_id IN (?) AND is_deleted = 0`,
      [productIds],
    );

    // ===== LẤY ALL IMAGES 1 LẦN =====
    const [images] = await db.query(
      `SELECT * FROM product_images 
     WHERE product_id IN (?) AND is_deleted = 0
     ORDER BY isThumbnail DESC`,
      [productIds],
    );

    // ===== GROUP SIZES & IMAGES =====
    const sizeMap = {};
    const imageMap = {};

    sizes.forEach((size) => {
      if (!sizeMap[size.product_id]) sizeMap[size.product_id] = [];
      sizeMap[size.product_id].push(size);
    });

    images.forEach((image) => {
      if (!imageMap[image.product_id]) imageMap[image.product_id] = [];
      imageMap[image.product_id].push(image);
    });

    // ===== GẮN VÀO PRODUCT =====
    products.forEach((product) => {
      product.sizes = sizeMap[product.id] || [];
      product.images = imageMap[product.id] || [];
    });

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
        [product.id],
      );
      product.sizes = sizes;

      const [images] = await db.query(
        'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
        [product.id],
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
        [product.id],
      );
      product.sizes = sizes;

      const [images] = await db.query(
        'SELECT * FROM product_images WHERE product_id = ? AND is_deleted = 0 ORDER BY isThumbnail DESC',
        [product.id],
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
