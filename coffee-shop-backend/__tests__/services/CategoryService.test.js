const CategoryService = require('../../src/services/CategoryService');
const CategoryRepository = require('../../src/repositories/CategoryRepository');

// Mock dependencies
jest.mock('../../src/repositories/CategoryRepository');

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET ALL CATEGORIES TESTS ==========
  describe('getAllCategories', () => {
    it('CategoryService - getAllCategories - TC-01: should get all active categories', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_ALL - TC-1: Lấy tất cả danh mục active');
      console.log('='.repeat(50));

      // Arrange
      const mockCategories = [
        { id: 1, name: 'Cà phê', is_deleted: 0 },
        { id: 2, name: 'Trà sữa', is_deleted: 0 },
      ];
      CategoryRepository.findAllActive.mockResolvedValue(mockCategories);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of active categories');

      // Act
      const result = await CategoryService.getAllCategories();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.findAllActive).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
    });

    it('CategoryService - getAllCategories - TC-02: should get categories with options', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_ALL - TC-2: Lấy danh mục với options');
      console.log('='.repeat(50));

      // INPUT
      const input = { limit: 10, offset: 0 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      CategoryRepository.findAllActive.mockResolvedValue([]);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Categories with pagination');

      // Act
      const result = await CategoryService.getAllCategories(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got categories');

      // Assert
      expect(CategoryRepository.findAllActive).toHaveBeenCalledWith(input);
    });
  });

  // ========== GET CATEGORIES WITH PRODUCT COUNT TESTS ==========
  describe('getCategoriesWithProductCount', () => {
    it('CategoryService - getCategoriesWithProductCount - TC-01: should get categories with product count', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_WITH_COUNT - TC-1: Lấy danh mục kèm số lượng sản phẩm');
      console.log('='.repeat(50));

      // Arrange
      const mockData = [
        { id: 1, name: 'Cà phê', product_count: 15 },
        { id: 2, name: 'Trà sữa', product_count: 10 },
      ];
      CategoryRepository.findAllWithProductCount.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Categories with product_count field');

      // Act
      const result = await CategoryService.getCategoriesWithProductCount();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.findAllWithProductCount).toHaveBeenCalled();
      expect(result[0]).toHaveProperty('product_count');
    });
  });

  // ========== GET CATEGORY BY ID TESTS ==========
  describe('getCategoryById', () => {
    it('CategoryService - getCategoryById - TC-01: should get category by ID successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_BY_ID - TC-1: Lấy danh mục theo ID thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(mockCategory);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Category with id = 1');

      // Act
      const result = await CategoryService.getCategoryById(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('CategoryService - getCategoryById - TC-02: should throw 404 when category not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_BY_ID - TC-2: Lỗi 404 khi category không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      CategoryRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Category không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error 404 -', expectedError);

      // Act & Assert
      await expect(CategoryService.getCategoryById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);
    });

    it('CategoryService - getCategoryById - TC-03: should throw 404 when category is deleted', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - GET_BY_ID - TC-3: Lỗi 404 khi category đã bị xóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockDeletedCategory = { id: 1, name: 'Cà phê', is_deleted: 1 };
      CategoryRepository.findById.mockResolvedValue(mockDeletedCategory);

      // OUTPUT EXPECT
      const expectedError = 'Category đã bị xóa';
      console.log('✅ OUTPUT EXPECT: Error 404 -', expectedError);

      // Act & Assert
      await expect(CategoryService.getCategoryById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);
    });
  });

  // ========== CREATE CATEGORY TESTS ==========
  describe('createCategory', () => {
    it('CategoryService - createCategory - TC-01: should create category successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - CREATE - TC-1: Tạo danh mục thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        name: 'Sinh tố',
        image_url: 'smoothie.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      CategoryRepository.findByName.mockResolvedValue(null);
      const mockCreatedCategory = { id: 3, name: 'Sinh tố', image_url: 'smoothie.jpg' };
      CategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created category with id = 3');

      // Act
      const result = await CategoryService.createCategory(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.findByName).toHaveBeenCalledWith(input.name);
      expect(CategoryRepository.create).toHaveBeenCalledWith({
        name: input.name.trim(),
        image_url: input.image_url,
      });
      expect(result.id).toBe(3);
    });

    it('CategoryService - createCategory - TC-02: should throw 409 when name exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - CREATE - TC-2: Lỗi 409 khi tên đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        name: 'Cà phê',
        image_url: 'coffee.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingCategory = { id: 1, name: 'Cà phê' };
      CategoryRepository.findByName.mockResolvedValue(existingCategory);

      // OUTPUT EXPECT
      const expectedError = 'Tên category đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error 409 -', expectedError);

      // Act & Assert
      await expect(CategoryService.createCategory(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(CategoryRepository.create).not.toHaveBeenCalled();
    });
  });

  // ========== UPDATE CATEGORY TESTS ==========
  describe('updateCategory', () => {
    it('CategoryService - updateCategory - TC-01: should update category successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - UPDATE - TC-1: Cập nhật danh mục thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        name: 'Coffee Updated',
        image_url: 'updated.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(existingCategory);
      CategoryRepository.findByName.mockResolvedValue(null);
      const mockUpdatedCategory = { ...existingCategory, ...input };
      CategoryRepository.update.mockResolvedValue(mockUpdatedCategory);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Updated category');

      // Act
      const result = await CategoryService.updateCategory(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.update).toHaveBeenCalledWith(1, {
        name: input.name.trim(),
        image_url: input.image_url,
      });
      expect(result.name).toBe('Coffee Updated');
    });

    it('CategoryService - updateCategory - TC-02: should throw 409 when new name exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - UPDATE - TC-2: Lỗi 409 khi tên mới đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        name: 'Trà sữa',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(existingCategory);
      const anotherCategory = { id: 2, name: 'Trà sữa' };
      CategoryRepository.findByName.mockResolvedValue(anotherCategory);

      // OUTPUT EXPECT
      const expectedError = 'Tên category đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error 409 -', expectedError);

      // Act & Assert
      await expect(CategoryService.updateCategory(input.id, input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });
  });

  // ========== DELETE CATEGORY TESTS ==========
  describe('deleteCategory', () => {
    it('CategoryService - deleteCategory - TC-01: should delete category successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - DELETE - TC-1: Xóa danh mục thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(existingCategory);
      CategoryRepository.hasProducts.mockResolvedValue(false);
      CategoryRepository.softDelete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Category soft deleted');

      // Act
      const result = await CategoryService.deleteCategory(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(CategoryRepository.hasProducts).toHaveBeenCalledWith(1);
      expect(CategoryRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('CategoryService - deleteCategory - TC-02: should throw 400 when category has products', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - DELETE - TC-2: Lỗi 400 khi danh mục có sản phẩm');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(existingCategory);
      CategoryRepository.hasProducts.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Không thể xóa category vì có sản phẩm đang sử dụng';
      console.log('✅ OUTPUT EXPECT: Error 400 -', expectedError);

      // Act & Assert
      await expect(CategoryService.deleteCategory(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(CategoryRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  // ========== SEARCH CATEGORIES TESTS ==========
  describe('searchCategories', () => {
    it('CategoryService - searchCategories - TC-01: should search categories by keyword', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - SEARCH - TC-1: Tìm kiếm danh mục theo từ khóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { keyword: 'Cà phê' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResults = [
        { id: 1, name: 'Cà phê', is_deleted: 0 },
      ];
      CategoryRepository.search.mockResolvedValue(mockResults);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of matching categories');

      // Act
      const result = await CategoryService.searchCategories(input.keyword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.search).toHaveBeenCalledWith('Cà phê', {});
      expect(result).toHaveLength(1);
    });

    it('CategoryService - searchCategories - TC-02: should return all when keyword empty', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - SEARCH - TC-2: Trả về tất cả khi keyword trống');
      console.log('='.repeat(50));

      // Arrange
      const mockCategories = [
        { id: 1, name: 'Cà phê' },
        { id: 2, name: 'Trà sữa' },
      ];
      CategoryRepository.findAllActive.mockResolvedValue(mockCategories);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: All active categories');

      // Act
      const result = await CategoryService.searchCategories('');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got all categories');

      // Assert
      expect(CategoryRepository.findAllActive).toHaveBeenCalled();
      expect(CategoryRepository.search).not.toHaveBeenCalled();
    });
  });

  // ========== RESTORE CATEGORY TESTS ==========
  describe('restoreCategory', () => {
    it('CategoryService - restoreCategory - TC-01: should restore deleted category', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - RESTORE - TC-1: Khôi phục danh mục đã xóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const deletedCategory = { id: 1, name: 'Cà phê', is_deleted: 1 };
      CategoryRepository.findById.mockResolvedValueOnce(deletedCategory);
      CategoryRepository.findByName.mockResolvedValue(null);
      const restoredCategory = { ...deletedCategory, is_deleted: 0 };
      CategoryRepository.update.mockResolvedValue(restoredCategory);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Restored category with is_deleted = 0');

      // Act
      const result = await CategoryService.restoreCategory(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(CategoryRepository.update).toHaveBeenCalledWith(1, { is_deleted: 0 });
      expect(result.is_deleted).toBe(0);
    });

    it('CategoryService - restoreCategory - TC-02: should throw 400 when category not deleted', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - RESTORE - TC-2: Lỗi 400 khi category chưa bị xóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const activeCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findById.mockResolvedValue(activeCategory);

      // OUTPUT EXPECT
      const expectedError = 'Category chưa bị xóa';
      console.log('✅ OUTPUT EXPECT: Error 400 -', expectedError);

      // Act & Assert
      await expect(CategoryService.restoreCategory(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });

    it('CategoryService - restoreCategory - TC-03: should throw 409 when name conflicts', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('CategoryService - RESTORE - TC-3: Lỗi 409 khi tên bị trùng');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const deletedCategory = { id: 1, name: 'Cà phê', is_deleted: 1 };
      CategoryRepository.findById.mockResolvedValue(deletedCategory);
      const existingCategory = { id: 2, name: 'Cà phê', is_deleted: 0 };
      CategoryRepository.findByName.mockResolvedValue(existingCategory);

      // OUTPUT EXPECT
      const expectedError = 'Không thể khôi phục vì tên category đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error 409 -', expectedError);

      // Act & Assert
      await expect(CategoryService.restoreCategory(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });
  });
});
