const ToppingRepository = require('../repositories/ToppingRepository');

class ToppingService {
  /**
   * Get all toppings
   */
  async getAllToppings(options = {}) {
    return ToppingRepository.findAllActive(options);
  }

  /**
   * Get topping by ID
   */
  async getToppingById(id) {
    const topping = await ToppingRepository.findById(id);

    if (!topping) {
      throw new Error('Topping không tồn tại');
    }

    if (topping.is_deleted === 1) {
      throw new Error('Topping đã bị xóa');
    }

    return topping;
  }

  /**
   * Create new topping
   */
  async createTopping(data) {
    // Validate: Check if topping name already exists
    const existingTopping = await ToppingRepository.findByName(data.name);

    if (existingTopping) {
      throw new Error('Topping đã tồn tại');
    }

    // Create topping
    const topping = await ToppingRepository.create({
      name: data.name.trim(),
      price: data.price || 0,
    });

    return topping;
  }

  /**
   * Update topping
   */
  async updateTopping(id, data) {
    // Check if topping exists
    const topping = await this.getToppingById(id);

    // If updating name, check if new name already exists
    if (data.name && data.name !== topping.name) {
      const existingTopping = await ToppingRepository.findByName(data.name);

      if (existingTopping && existingTopping.id !== id) {
        throw new Error('Tên topping đã tồn tại');
      }
    }

    // Update topping
    const updatedTopping = await ToppingRepository.update(id, {
      name: data.name ? data.name.trim() : topping.name,
      price: data.price !== undefined ? data.price : topping.price,
    });

    return updatedTopping;
  }

  /**
   * Delete topping (soft delete)
   */
  async deleteTopping(id) {
    // Check if topping exists
    await this.getToppingById(id);

    // Soft delete
    const deleted = await ToppingRepository.softDelete(id);

    if (!deleted) {
      throw new Error('Xóa topping thất bại');
    }

    return true;
  }

  /**
   * Search toppings
   */
  async searchToppings(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllToppings(options);
    }

    return ToppingRepository.search(keyword.trim(), options);
  }

  /**
   * Restore deleted topping
   */
  async restoreTopping(id) {
    const topping = await ToppingRepository.findById(id);

    if (!topping) {
      throw new Error('Topping không tồn tại');
    }

    if (topping.is_deleted === 0) {
      throw new Error('Topping chưa bị xóa');
    }

    // Restore by setting is_deleted = 0
    const restored = await ToppingRepository.update(id, { is_deleted: 0 });

    return restored;
  }
}

module.exports = new ToppingService();
