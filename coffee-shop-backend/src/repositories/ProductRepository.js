const BaseRepository = require("./BaseRepository");
const db = require("../config/database");

class ProductRepository extends BaseRepository {
  constructor() {
    super("products");
  }

  async findByName(name) {
    return this.findOne({ name, is_deleted: 0 });
  }

  async findByIdWithDetails(id) {
    const [products] = await db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.category_id,
        p.is_deleted,
        c.name AS category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_deleted = 0
      LIMIT 1
      `,
      [id]
    );

    if (products.length === 0) return null;

    const product = products[0];

    const [images] = await db.query(
      `
      SELECT id, product_id, image_url, isThumbnail
      FROM product_images
      WHERE product_id = ? AND is_deleted = 0
      ORDER BY isThumbnail DESC, id ASC
      `,
      [id]
    );

    const [sizes] = await db.query(
      `
      SELECT id, product_id, size, price
      FROM product_sizes
      WHERE product_id = ? AND is_deleted = 0
      ORDER BY FIELD(size, 'S', 'M', 'L')
      `,
      [id]
    );

    return {
      ...product,
      images,
      sizes,
    };
  }

  buildSortClause(sort) {
    switch (sort) {
      case "name_asc":
        return "ORDER BY p.name ASC";
      case "name_desc":
        return "ORDER BY p.name DESC";
      case "price_asc":
        return `
          ORDER BY (
            SELECT MIN(ps.price)
            FROM product_sizes ps
            WHERE ps.product_id = p.id AND ps.is_deleted = 0
          ) ASC, p.id DESC
        `;
      case "price_desc":
        return `
          ORDER BY (
            SELECT MIN(ps.price)
            FROM product_sizes ps
            WHERE ps.product_id = p.id AND ps.is_deleted = 0
          ) DESC, p.id DESC
        `;
      default:
        return "ORDER BY p.id DESC";
    }
  }

  async attachSizesAndImages(products) {
    if (!products.length) return [];

    const productIds = products.map((p) => p.id);

    const [sizes] = await db.query(
      `
      SELECT *
      FROM product_sizes
      WHERE product_id IN (?) AND is_deleted = 0
      ORDER BY FIELD(size, 'S', 'M', 'L')
      `,
      [productIds]
    );

    const [images] = await db.query(
      `
      SELECT *
      FROM product_images
      WHERE product_id IN (?) AND is_deleted = 0
      ORDER BY isThumbnail DESC, id ASC
      `,
      [productIds]
    );

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

    return products.map((product) => ({
      ...product,
      sizes: sizeMap[product.id] || [],
      images: imageMap[product.id] || [],
    }));
  }

  async findAllWithDetails(conditions = {}, options = {}) {
    const { limit, offset, sort } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.is_deleted = 0
    `;

    const params = [];

    Object.keys(conditions).forEach((key) => {
      query += ` AND p.${key} = ?`;
      params.push(conditions[key]);
    });

    query += ` ${this.buildSortClause(sort)}`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset) || 0);
    }

    const [products] = await db.query(query, params);
    return this.attachSizesAndImages(products);
  }

  async findByCategory(categoryId, options = {}) {
    const { limit, offset, sort, status = "available" } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.category_id = ?
        AND p.status = ?
        AND p.is_deleted = 0
    `;

    const params = [categoryId, status];

    query += ` ${this.buildSortClause(sort)}`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset) || 0);
    }

    const [products] = await db.query(query, params);
    return this.attachSizesAndImages(products);
  }

  async countByCategory(categoryId, status = "available") {
    const query = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE p.category_id = ?
        AND p.status = ?
        AND p.is_deleted = 0
    `;

    const [rows] = await db.query(query, [categoryId, status]);
    return rows[0].total;
  }

  async search(keyword, options = {}) {
    const { limit = 20, offset = 0, category_id, status, sort } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.name LIKE ?
        AND p.is_deleted = 0
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

    query += ` ${this.buildSortClause(sort)} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.query(query, params);
    return this.attachSizesAndImages(products);
  }

  async countSearch(keyword, options = {}) {
    const { category_id, status } = options;

    let query = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE p.name LIKE ?
        AND p.is_deleted = 0
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

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  async countAll(conditions = {}) {
    let query = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.is_deleted = 0
    `;

    const params = [];

    Object.keys(conditions).forEach((key) => {
      query += ` AND p.${key} = ?`;
      params.push(conditions[key]);
    });

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }
}

module.exports = new ProductRepository();
