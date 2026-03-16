const CategoryRepository = require("../repositories/CategoryRepository");
const ErrorResponse = require("../utils/ErrorResponse");

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
      throw new ErrorResponse(404, "Category không tồn tại");
    }

    if (category.is_deleted === 1) {
      throw new ErrorResponse(404, "Category đã bị xóa");
    }

    return category;
  }

  /**
   * Get category with product count
   */
  async getCategoryWithProductCount(id) {
    const category = await CategoryRepository.findByIdWithProductCount(id);

    if (!category) {
      throw new ErrorResponse(404, "Category không tồn tại");
    }

    if (category.is_deleted === 1) {
      throw new ErrorResponse(404, "Category đã bị xóa");
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
      throw new ErrorResponse(409, "Tên category đã tồn tại");
    }

    // Create category
    const category = await CategoryRepository.create({
      name: data.name.trim(),
      image_url: data.image_url || null,
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

      if (existingCategory && existingCategory.id !== parseInt(id)) {
        throw new ErrorResponse(409, "Tên category đã tồn tại");
      }
    }

    // Prepare update data
    const updateData = {};
    if (data.name) {
      updateData.name = data.name.trim();
    }
    if (data.image_url !== undefined) {
      updateData.image_url = data.image_url;
    }

    // Update category
    const updatedCategory = await CategoryRepository.update(id, updateData);

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
      throw new ErrorResponse(
        400,
        "Không thể xóa category vì có sản phẩm đang sử dụng"
      );
    }

    // Soft delete
    const deleted = await CategoryRepository.softDelete(id);

    if (!deleted) {
      throw new ErrorResponse(500, "Xóa category thất bại");
    }

    return true;
  }

  /**
   * Search categories
   */
  async searchCategories(keyword, options = {}) {
    if (!keyword || keyword.trim() === "") {
      return this.getAllCategories(options);
    }

    return CategoryRepository.search(keyword.trim(), options);
  }

  /**
   * Count total categories
   */
  async countCategories() {
    return CategoryRepository.count({ is_deleted: 0 });
  }

  /**
   * Count search results
   */
  async countSearchResults(keyword) {
    if (!keyword || keyword.trim() === "") {
      return this.countCategories();
    }
    return CategoryRepository.countSearch(keyword.trim());
  }

  /**
   * Restore deleted category
   */
  async restoreCategory(id) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      throw new ErrorResponse(404, "Category không tồn tại");
    }

    if (category.is_deleted === 0) {
      throw new ErrorResponse(400, "Category chưa bị xóa");
    }

    // Check if restoring would create duplicate name
    const existingCategory = await CategoryRepository.findByName(category.name);
    if (existingCategory && existingCategory.id !== category.id) {
      throw new ErrorResponse(
        409,
        "Không thể khôi phục vì tên category đã tồn tại"
      );
    }

    // Restore by setting is_deleted = 0
    const restored = await CategoryRepository.update(id, { is_deleted: 0 });

    return restored;
  }
}

module.exports = new CategoryService();
