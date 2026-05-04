const BaseRepository = require("./BaseRepository");
const db = require("../config/database");

class ProductRepository extends BaseRepository {
  constructor() {
    super("products");
  }

  async findByName(name) {
    return this.findOne({ name, is_deleted: 0 });
  }

  async findByCode(code) {
    return this.findOne({ code, is_deleted: 0 });
  }

  async findBySlug(slug) {
    return this.findOne({ slug, is_deleted: 0 });
  }

  async findBySlugWithDetails(slug) {
    const [products] = await db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.code,
        p.slug,
        p.description,
        p.status,
        p.category_id,
        p.is_deleted,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_deleted = 0
      LIMIT 1
      `,
      [slug]
    );

    if (products.length === 0) return null;

    const product = products[0];
    const id = product.id;

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

  async findByIdWithDetails(id) {
    const [products] = await db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.code,
        p.description,
        p.status,
        p.category_id,
        p.is_deleted,
        c.name AS category_name,
        c.slug AS category_slug
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
      case "rating_desc":
        return `
          ORDER BY (
            SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id
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

  buildAdvancedCondition(options) {
    let sql = "";
    const params = [];
    const { min_price, max_price, size, min_rating } = options || {};

    if (min_price !== undefined || max_price !== undefined || size !== undefined) {
      sql += ` AND EXISTS (
        SELECT 1 FROM product_sizes ps
        WHERE ps.product_id = p.id
          AND ps.is_deleted = 0`;

      if (size !== undefined && size !== "") {
        sql += ` AND ps.size = ?`;
        params.push(size);
      }
      if (min_price !== undefined && min_price !== "") {
        sql += ` AND ps.price >= ?`;
        params.push(parseInt(min_price));
      }
      if (max_price !== undefined && max_price !== "") {
        sql += ` AND ps.price <= ?`;
        params.push(parseInt(max_price));
      }
      sql += `)`;
    }

    if (min_rating !== undefined && min_rating !== "") {
      sql += ` AND (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id) >= ?`;
      params.push(Number(min_rating));
    }

    return { sql, params };
  }

  async findAllWithDetails(conditions = {}, options = {}) {
    const { limit, offset, sort } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id) as rating
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.is_deleted = 0
    `;

    const params = [];

    Object.keys(conditions).forEach((key) => {
      query += ` AND p.${key} = ?`;
      params.push(conditions[key]);
    });

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

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
        c.name as category_name,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id) as rating
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.category_id = ?
        AND p.status = ?
        AND p.is_deleted = 0
    `;

    const params = [categoryId, status];

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

    query += ` ${this.buildSortClause(sort)}`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset) || 0);
    }

    const [products] = await db.query(query, params);
    return this.attachSizesAndImages(products);
  }

  async countByCategory(categoryId, options = {}) {
    const { status = "available" } = options;

    let query = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE p.category_id = ?
        AND p.status = ?
        AND p.is_deleted = 0
    `;

    const params = [categoryId, status];

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  async search(keyword, options = {}) {
    const { limit = 20, offset = 0, category_id, status, sort } = options;

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id) as rating
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

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

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

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  async countAll(conditions = {}, options = {}) {
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

    const advanced = this.buildAdvancedCondition(options);
    query += advanced.sql;
    params.push(...advanced.params);

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  async findBestSellers(limit = 8) {
    const normalizedLimit = Math.max(1, parseInt(limit, 10) || 8);
    const queryTimeoutMs = 15_000;

    const [topRows] = await db.query({
      sql: `
        SELECT
          ps.product_id,
          SUM(od.quantity) AS total_sold
        FROM orders o
        JOIN order_details od ON od.order_id = o.id
        JOIN product_sizes ps ON ps.id = od.product_size_id
        WHERE o.status = 'completed'
        GROUP BY ps.product_id
        ORDER BY total_sold DESC, ps.product_id DESC
        LIMIT ?
      `,
      values: [normalizedLimit],
      timeout: queryTimeoutMs,
    });

    if (!topRows || topRows.length === 0) return [];

    const productIds = topRows.map((r) => r.product_id);
    const totalSoldByProductId = new Map(topRows.map((r) => [r.product_id, Number(r.total_sold) || 0]));

    const [products] = await db.query({
      sql: `
        SELECT
          p.*,
          c.name AS category_name
        FROM products p
        LEFT JOIN category c ON c.id = p.category_id
        WHERE p.id IN (?)
          AND p.is_deleted = 0
          AND p.status = 'available'
      `,
      values: [productIds],
      timeout: queryTimeoutMs,
    });

    if (!products || products.length === 0) return [];

    const [ratingRows] = await db.query({
      sql: `
        SELECT product_id, AVG(rating) AS avg_rating
        FROM reviews
        WHERE product_id IN (?)
        GROUP BY product_id
      `,
      values: [productIds],
      timeout: queryTimeoutMs,
    });

    const ratingByProductId = new Map(
      (ratingRows || []).map((r) => [r.product_id, Number(r.avg_rating) || 0])
    );

    const productById = new Map(products.map((p) => [p.id, p]));
    const ordered = productIds
      .map((id) => productById.get(id))
      .filter(Boolean)
      .map((p) => ({
        ...p,
        total_sold: totalSoldByProductId.get(p.id) || 0,
        rating: ratingByProductId.get(p.id) || 0,
      }));

    return this.attachSizesAndImages(ordered);
  }
}

module.exports = new ProductRepository();
