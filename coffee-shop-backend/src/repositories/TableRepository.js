const BaseRepository = require("./BaseRepository");

class TableRepository extends BaseRepository {
  constructor() {
    super("tables");
  }

  /**
   * Find tables by area ID
   */
  async findByAreaId(areaId) {
    return await this.findAll(
      { area_id: areaId },
      { orderBy: "table_number", order: "ASC" },
    );
  }

  async existsInArea(tableNumber, areaId, excludeId = null) {
    const query = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE table_number = ? 
      AND area_id = ? 
      AND is_deleted = 0
      ${excludeId ? "AND id != ?" : ""}
    `;

    const params = [tableNumber, areaId];
    if (excludeId) params.push(excludeId);

    const [rows] = await this.db.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = new TableRepository();
