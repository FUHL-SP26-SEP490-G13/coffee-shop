const CategoryRepository = require("../repositories/CategoryRepository");
const ErrorResponse = require("../utils/ErrorResponse");
const slugify = require("slugify");

class CategoryService {
  /**
   * Get all categories
   */
  async getAllCategories(options = {}) {
    return CategoryRepository.findAllActive(options);
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
   * Create new category
   */
  async createCategory(data) {
    const existingName = await CategoryRepository.findByName(data.name);
    if (existingName) {
      throw new ErrorResponse(409, 'Tên category đã tồn tại');
    }

    const existingCode = await CategoryRepository.findByCode(data.code);
    if (existingCode) {
      throw new ErrorResponse(409, 'Mã code category đã tồn tại');
    }

    let baseSlug = slugify(data.name.replace(/đ/g, 'd').replace(/Đ/g, 'D'), { lower: true, strict: true, locale: 'vi' });
    let slug = baseSlug;
    let counter = 1;
    while (await CategoryRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return CategoryRepository.create({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      image_url: data.image_url || null,
      slug: slug,
    });
  }

  /**
   * Update category
   */
  async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    const updateData = {};

    // If updating name, check if new name already exists
    if (data.name && data.name !== category.name) {
      const existingCategory = await CategoryRepository.findByName(data.name);
      if (existingCategory && existingCategory.id !== parseInt(id)) {
        throw new ErrorResponse(409, 'Tên danh mục đã tồn tại');
      }
      updateData.name = data.name.trim();

      let baseSlug = slugify(data.name.replace(/đ/g, 'd').replace(/Đ/g, 'D'), { lower: true, strict: true, locale: 'vi' });
      let slug = baseSlug;
      let counter = 1;
      let isUnique = false;
      while (!isUnique) {
        const checkSlug = await CategoryRepository.findBySlug(slug);
        if (!checkSlug || checkSlug.id === parseInt(id)) {
          isUnique = true;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      updateData.slug = slug;
    }

    // check category code if exist
    if (data.code && data.code !== category.code) {
      const existingCode = await CategoryRepository.findByCode(data.code);
      if (existingCode && existingCode.id !== parseInt(id)) {
        throw new ErrorResponse(409, 'Mã Code danh mục đã tồn tại');
      }
      updateData.code = data.code.trim().toUpperCase();
    }

    if (data.image_url !== undefined) {
      updateData.image_url = data.image_url;
    }

    return CategoryRepository.update(id, updateData);
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
      throw new ErrorResponse(400, 'Không thể xóa danh mục vì có sản phẩm đang sử dụng');
    }

    // Soft delete
    const deleted = await CategoryRepository.softDelete(id);

    if (!deleted) {
      throw new ErrorResponse(500, "Xóa danh mục thất bại");
    }

    return true;
  }
}

module.exports = new CategoryService();
