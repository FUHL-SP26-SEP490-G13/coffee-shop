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
      { orderBy: "code", order: "ASC" },
    );
  }


}

module.exports = new TableRepository();
