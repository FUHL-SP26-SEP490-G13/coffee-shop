const AreaRepository = require('../repositories/AreaRepository');

class AreaService {
  /**
   * Get all areas
   */
  async getAllAreas() {
    return await AreaRepository.findAll({}, { orderBy: 'name', order: 'ASC' });
  }

  /**
   * Get area by ID
   */
  async getAreaById(id) {
    const area = await AreaRepository.findById(id);
    if (!area) {
      throw new Error('Khu vực không tồn tại');
    }
    return area;
  }

  /**
   * Create new area
   */
  async createArea(data) {
    // Check if area name already exists
    const existingArea = await AreaRepository.findOne({ name: data.name });
    if (existingArea) {
      throw new Error('Tên khu vực đã tồn tại');
    }

    return await AreaRepository.create({
      name: data.name
    });
  }

  /**
   * Update area
   */
  async updateArea(id, data) {
    const area = await this.getAreaById(id);

    if (data.name && data.name !== area.name) {
      const existingArea = await AreaRepository.findOne({ name: data.name });
      if (existingArea) {
        throw new Error('Tên khu vực đã tồn tại');
      }
    }

    return await AreaRepository.update(id, {
      name: data.name
    });
  }

  /**
   * Delete area (hard delete)
   */
  async deleteArea(id) {
    await this.getAreaById(id);
    return await AreaRepository.hardDelete(id);
  }


  /**
   * Search areas
   */
  async searchAreas(keyword, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    let query = `SELECT * FROM area WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?`;

    const [rows] = await AreaRepository.db.query(query, [`%${keyword}%`, limit, offset]);
    return rows;
  }
}

module.exports = new AreaService();
