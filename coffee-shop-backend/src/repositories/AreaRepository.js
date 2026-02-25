const BaseRepository = require('./BaseRepository');

class AreaRepository extends BaseRepository {
  constructor() {
    super('area');
  }


  /**
   * Get all areas with optional filtering
   */
  async findAllCustom(conditions = {}, options = {}) {
    const { limit, offset, orderBy = 'id', order = 'ASC' } = options;

    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    const conditionKeys = Object.keys(conditions);
    if (conditionKeys.length > 0) {
      query += ` WHERE `;
      query += conditionKeys.map(key => `${key} = ?`).join(' AND ');
      params.push(...Object.values(conditions));
    }

    query += ` ORDER BY ${orderBy} ${order}`;


    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset || 0);
    }

    const [rows] = await this.db.query(query, params);
    return rows;
  }
}

module.exports = new AreaRepository();
