const CategoryRepository = require('../repositories/CategoryRepository');

class CategoryService {
  /**
   * Get all categories
   */
  async getAllCategories(options = {}) {
    return CategoryRepository.findAllActive(options);
  }

  /**
   * Get all categories with product count
   */
  async getCategoriesWithProductCount() {
    return CategoryRepository.findAllWithProductCount();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      throw new Error('Category không tồn tại');
    }

    if (category.is_deleted === 1) {
      throw new Error('Category đã bị xóa');
    }

    return category;
  }

  /**
   * Get category with product count
   */
  async getCategoryWithProductCount(id) {
    const category = await CategoryRepository.findByIdWithProductCount(id);

    if (!category) {
      throw new Error('Category không tồn tại');
    }

    return category;
  }

  /**
   * Create new category
   */
  async createCategory(data) {
    // Validate: Check if category name already exists
    const existingCategory = await CategoryRepository.findByName(data.name);

    if (existingCategory) {
      throw new Error('Category đã tồn tại');
    }

    // Create category
    const category = await CategoryRepository.create({
      name: data.name.trim(),
    });

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id, data) {
    // Check if category exists
    const category = await this.getCategoryById(id);

    // If updating name, check if new name already exists
    if (data.name && data.name !== category.name) {
      const existingCategory = await CategoryRepository.findByName(data.name);

      if (existingCategory && existingCategory.id !== id) {
        throw new Error('Tên category đã tồn tại');
      }
    }

    // Update category
    const updatedCategory = await CategoryRepository.update(id, {
      name: data.name.trim(),
    });

    return updatedCategory;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id) {
    // Check if category exists
    await this.getCategoryById(id);

    // Check if category has products
    const hasProducts = await CategoryRepository.hasProducts(id);

    if (hasProducts) {
      throw new Error('Không thể xóa category vì có sản phẩm đang sử dụng');
    }

    // Soft delete
    const deleted = await CategoryRepository.softDelete(id);

    if (!deleted) {
      throw new Error('Xóa category thất bại');
    }

    return true;
  }

  /**
   * Search categories
   */
  async searchCategories(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllCategories(options);
    }

    return CategoryRepository.search(keyword.trim(), options);
  }

  /**
   * Restore deleted category
   */
  async restoreCategory(id) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      throw new Error('Category không tồn tại');
    }

    if (category.is_deleted === 0) {
      throw new Error('Category chưa bị xóa');
    }

    // Restore by setting is_deleted = 0
    const restored = await CategoryRepository.update(id, { is_deleted: 0 });

    return restored;
  }
}

module.exports = new CategoryService();
