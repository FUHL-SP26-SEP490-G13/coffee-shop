const RecipeService = require('../../src/services/RecipeService');
const RecipeRepository = require('../../src/repositories/RecipeRepository');

const { logTestCase } = require('../utils/logger');

jest.mock('../../src/repositories/RecipeRepository');

let pendingLogCase = null;

const logCase = (payload = {}) => {
  pendingLogCase = payload;
};

const logReality = (actual) => {
  const payload = pendingLogCase || {};
  const {
    title,
    method,
    tcid,
    crud,
    scenario,
    input,
    expected,
    outputExpect,
    reality,
  } = payload;

  const nameParts = [title, method, scenario, tcid].filter(Boolean);
  if (crud) nameParts.push(`CRUD: ${crud}`);

  logTestCase({
    name: nameParts.join(' - ') || 'Test case',
    input,
    expected: expected !== undefined ? expected : outputExpect,
    actual: actual !== undefined ? actual : reality,
  });

  pendingLogCase = null;
};

describe('RecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecipesByProductSize', () => {
    it('RecipeService - getRecipesByProductSize - TC-01: RCP-SVC-RD-001 - CRUD: READ', async () => {
      const input = { productSizeId: 10 };
      const expected = [
        {
          id: 1,
          product_size_id: 10,
          ingredient_id: 2,
          quantity: 25,
          ingredient_name: 'Trân châu',
          unit_type: 'weight',
          unit: 'gram',
        },
      ];
      logCase({
        tcid: 'RCP-SVC-RD-001',
        crud: 'READ',
        scenario: 'lấy công thức theo kích thước sản phẩm',
        input,
        expected,
      });

      RecipeRepository.getRecipesByProductSize.mockResolvedValue(expected);

      const result = await RecipeService.getRecipesByProductSize(input.productSizeId);
      logReality(result);

      expect(RecipeRepository.getRecipesByProductSize).toHaveBeenCalledWith(10);
      expect(result).toEqual(expected);
    });

    it('RecipeService - getRecipesByProductSize - TC-02: RCP-SVC-RD-002 - CRUD: READ', async () => {
      const input = { productSizeId: 11 };
      const expected = [];
      logCase({
        tcid: 'RCP-SVC-RD-002',
        crud: 'READ',
        scenario: 'không có công thức theo kích thước sản phẩm',
        input,
        expected,
      });

      RecipeRepository.getRecipesByProductSize.mockResolvedValue([]);

      const result = await RecipeService.getRecipesByProductSize(input.productSizeId);
      logReality(result);

      expect(result).toEqual(expected);
    });
  });

  describe('getRecipesByProductGroupedBySize', () => {
    it('RecipeService - getRecipesByProductGroupedBySize - TC-01: RCP-SVC-RD-003 - CRUD: READ', async () => {
      const input = { productId: 1 };
      const rows = [
        {
          product_size_id: 101,
          product_id: 1,
          size: 'M',
          price: 30000,
          recipe_id: 5001,
          ingredient_id: 2,
          quantity: 20,
          ingredient_name: 'Trân châu',
          unit_type: 'weight',
          unit: 'gram',
        },
        {
          product_size_id: 102,
          product_id: 1,
          size: 'L',
          price: 35000,
          recipe_id: null,
          ingredient_id: null,
          quantity: null,
          ingredient_name: null,
          unit_type: null,
          unit: null,
        },
      ];

      const expected = {
        product_id: 1,
        sizes: {
          M: {
            product_size_id: 101,
            product_id: 1,
            size: 'M',
            price: 30000,
            recipes: [
              {
                id: 5001,
                ingredient_id: 2,
                quantity: 20,
                ingredient_name: 'Trân châu',
                unit_type: 'weight',
                unit: 'gram',
              },
            ],
          },
          L: {
            product_size_id: 102,
            product_id: 1,
            size: 'L',
            price: 35000,
            recipes: [],
          },
        },
      };

      logCase({
        tcid: 'RCP-SVC-RD-003',
        crud: 'READ',
        scenario: 'gom nhóm công thức theo size',
        input,
        expected,
      });

      RecipeRepository.getRecipesByProductGroupedBySize.mockResolvedValue(rows);

      const result = await RecipeService.getRecipesByProductGroupedBySize(input.productId);
      logReality(result);

      expect(RecipeRepository.getRecipesByProductGroupedBySize).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it('RecipeService - getRecipesByProductGroupedBySize - TC-02: RCP-SVC-RD-004 - CRUD: READ', async () => {
      const input = { productId: 2 };
      const expected = {
        product_id: 2,
        sizes: {},
      };
      logCase({
        tcid: 'RCP-SVC-RD-004',
        crud: 'READ',
        scenario: 'không có công thức để gom nhóm theo size',
        input,
        expected,
      });

      RecipeRepository.getRecipesByProductGroupedBySize.mockResolvedValue([]);

      const result = await RecipeService.getRecipesByProductGroupedBySize(input.productId);
      logReality(result);

      expect(result).toEqual(expected);
    });
  });

  describe('getRecipesByProduct', () => {
    it('RecipeService - getRecipesByProduct - TC-01: RCP-SVC-RD-005 - CRUD: READ', async () => {
      const input = { productId: 5 };
      const expected = [
        { id: 1, product_size_id: 11, ingredient_id: 3, quantity: 10, size: 'M' },
        { id: 2, product_size_id: 12, ingredient_id: 4, quantity: 15, size: 'L' },
      ];
      logCase({
        tcid: 'RCP-SVC-RD-005',
        crud: 'READ',
        scenario: 'lấy toàn bộ công thức theo product',
        input,
        expected,
      });

      RecipeRepository.getRecipesByProduct.mockResolvedValue(expected);

      const result = await RecipeService.getRecipesByProduct(input.productId);
      logReality(result);

      expect(RecipeRepository.getRecipesByProduct).toHaveBeenCalledWith(5);
      expect(result).toEqual(expected);
    });
  });

  describe('getRecipeById', () => {
    it('RecipeService - getRecipeById - TC-01: RCP-SVC-RD-006 - CRUD: READ', async () => {
      const input = { recipeId: 101 };
      const expected = {
        id: 101,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 30,
        ingredient_name: 'Sữa đặc',
      };
      logCase({
        tcid: 'RCP-SVC-RD-006',
        crud: 'READ',
        scenario: 'lấy chi tiết công thức theo id',
        input,
        expected,
      });

      RecipeRepository.getRecipeById.mockResolvedValue(expected);

      const result = await RecipeService.getRecipeById(input.recipeId);
      logReality(result);

      expect(RecipeRepository.getRecipeById).toHaveBeenCalledWith(101);
      expect(result).toEqual(expected);
    });

    it('RecipeService - getRecipeById - TC-02: RCP-SVC-RD-007 - CRUD: READ', async () => {
      const input = { recipeId: 9999 };
      const expectedError = 'Công thức không tồn tại';
      logCase({
        tcid: 'RCP-SVC-RD-007',
        crud: 'READ',
        scenario: 'lỗi công thức không tồn tại khi lấy theo id',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getRecipeById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.getRecipeById(input.recipeId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });
  });

  describe('createRecipe', () => {
    it('RecipeService - createRecipe - TC-01: RCP-SVC-CR-001 - CRUD: CREATE', async () => {
      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 25,
      };
      const mockIngredient = {
        id: 2,
        name: 'Trân châu',
        unit_type: 'weight',
        unit: 'gram',
      };
      const expected = {
        id: 101,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 25,
      };
      logCase({
        tcid: 'RCP-SVC-CR-001',
        crud: 'CREATE',
        scenario: 'tạo công thức mới khi chưa tồn tại',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue(null);
      RecipeRepository.createRecipe.mockResolvedValue(expected);

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );
      logReality(result);

      expect(RecipeRepository.getIngredientById).toHaveBeenCalledWith(2);
      expect(RecipeRepository.recipeExists).toHaveBeenCalledWith(10, 2);
      expect(RecipeRepository.createRecipe).toHaveBeenCalledWith(10, 2, 25);
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('RecipeService - createRecipe - TC-02: RCP-SVC-CR-002 - CRUD: CREATE', async () => {
      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 30,
      };
      const mockIngredient = {
        id: 2,
        name: 'Sữa tươi',
        unit_type: 'volume',
        unit: 'ml',
      };
      const existingRecipe = {
        id: 205,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 30,
      };
      const expected = existingRecipe;
      logCase({
        tcid: 'RCP-SVC-CR-002',
        crud: 'CREATE',
        scenario: 'không cộng dồn khi quantity mới bằng quantity cũ',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue({ id: 205, quantity: 30 });
      RecipeRepository.getRecipeById.mockResolvedValue(existingRecipe);

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );
      logReality(result);

      expect(RecipeRepository.getRecipeById).toHaveBeenCalledWith(205);
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
      expect(RecipeRepository.createRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('RecipeService - createRecipe - TC-03: RCP-SVC-CR-003 - CRUD: CREATE', async () => {
      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 5,
      };
      const mockIngredient = {
        id: 2,
        name: 'Sữa đặc',
        unit_type: 'volume',
        unit: 'ml',
      };
      const expected = {
        id: 305,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 17,
      };
      logCase({
        tcid: 'RCP-SVC-CR-003',
        crud: 'CREATE',
        scenario: 'cộng dồn khi quantity mới khác quantity cũ',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue({ id: 305, quantity: 12 });
      RecipeRepository.updateRecipe.mockResolvedValue(expected);

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );
      logReality(result);

      expect(RecipeRepository.updateRecipe).toHaveBeenCalledWith(305, 2, 17);
      expect(RecipeRepository.createRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('RecipeService - createRecipe - TC-04: RCP-SVC-CR-004 - CRUD: CREATE', async () => {
      const input = {
        productSizeId: 10,
        ingredientId: 9999,
        quantity: 10,
      };
      const expectedError = 'Nguyên liệu không tồn tại';
      logCase({
        tcid: 'RCP-SVC-CR-004',
        crud: 'CREATE',
        scenario: 'lỗi khi ingredient không tồn tại',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getIngredientById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.createRecipe(
          input.productSizeId,
          input.ingredientId,
          input.quantity
        );
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.recipeExists).not.toHaveBeenCalled();
    });

    it('RecipeService - createRecipe - TC-05: RCP-SVC-CR-006 - CRUD: CREATE', async () => {
      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: -3,
      };
      const mockIngredient = {
        id: 2,
        name: 'Sữa đặc',
        unit_type: 'volume',
        unit: 'ml',
      };
      const expected = {
        id: 401,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 7,
      };
      logCase({
        tcid: 'RCP-SVC-CR-006',
        crud: 'CREATE',
        scenario: 'quantity âm vẫn được cộng dồn theo logic hiện tại',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue({ id: 401, quantity: 10 });
      RecipeRepository.updateRecipe.mockResolvedValue(expected);

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );
      logReality(result);

      expect(RecipeRepository.updateRecipe).toHaveBeenCalledWith(401, 2, 7);
      expect(result).toEqual(expected);
    });
  });

  describe('updateRecipe', () => {
    it('RecipeService - updateRecipe - TC-01: RCP-SVC-UP-001 - CRUD: UPDATE', async () => {
      const input = { recipeId: 11, ingredientId: 3, quantity: 18 };
      const existingRecipe = { id: 11, ingredient_id: 2, quantity: 10 };
      const ingredient = { id: 3, name: 'Sữa tươi' };
      const expected = {
        id: 11,
        product_size_id: 10,
        ingredient_id: 3,
        quantity: 18,
      };
      logCase({
        tcid: 'RCP-SVC-UP-001',
        crud: 'UPDATE',
        scenario: 'cập nhật công thức thành công',
        input,
        expected,
      });

      RecipeRepository.getRecipeById.mockResolvedValue(existingRecipe);
      RecipeRepository.getIngredientById.mockResolvedValue(ingredient);
      RecipeRepository.updateRecipe.mockResolvedValue(expected);

      const result = await RecipeService.updateRecipe(
        input.recipeId,
        input.ingredientId,
        input.quantity
      );
      logReality(result);

      expect(RecipeRepository.getRecipeById).toHaveBeenCalledWith(11);
      expect(RecipeRepository.getIngredientById).toHaveBeenCalledWith(3);
      expect(RecipeRepository.updateRecipe).toHaveBeenCalledWith(11, 3, 18);
      expect(result).toEqual(expected);
    });

    it('RecipeService - updateRecipe - TC-02: RCP-SVC-UP-002 - CRUD: UPDATE', async () => {
      const input = { recipeId: 9999, ingredientId: 3, quantity: 18 };
      const expectedError = 'Công thức không tồn tại';
      logCase({
        tcid: 'RCP-SVC-UP-002',
        crud: 'UPDATE',
        scenario: 'lỗi công thức không tồn tại khi cập nhật',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getRecipeById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.updateRecipe(input.recipeId, input.ingredientId, input.quantity);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.getIngredientById).not.toHaveBeenCalled();
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
    });

    it('RecipeService - updateRecipe - TC-03: RCP-SVC-UP-003 - CRUD: UPDATE', async () => {
      const input = { recipeId: 11, ingredientId: 999, quantity: 18 };
      const expectedError = 'Nguyên liệu không tồn tại';
      logCase({
        tcid: 'RCP-SVC-UP-003',
        crud: 'UPDATE',
        scenario: 'lỗi ingredient không tồn tại khi cập nhật',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getRecipeById.mockResolvedValue({ id: 11 });
      RecipeRepository.getIngredientById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.updateRecipe(input.recipeId, input.ingredientId, input.quantity);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
    });
  });

  describe('deleteRecipe', () => {
    it('RecipeService - deleteRecipe - TC-01: RCP-SVC-DE-001 - CRUD: DELETE', async () => {
      const input = { recipeId: 15 };
      const expected = { id: 15 };
      logCase({
        tcid: 'RCP-SVC-DE-001',
        crud: 'DELETE',
        scenario: 'xóa công thức thành công',
        input,
        expected,
      });

      RecipeRepository.getRecipeById.mockResolvedValue({ id: 15 });
      RecipeRepository.deleteRecipe.mockResolvedValue(true);

      const result = await RecipeService.deleteRecipe(input.recipeId);
      logReality(result);

      expect(RecipeRepository.deleteRecipe).toHaveBeenCalledWith(15);
      expect(result).toEqual(expected);
    });

    it('RecipeService - deleteRecipe - TC-02: RCP-SVC-DE-002 - CRUD: DELETE', async () => {
      const input = { recipeId: 9999 };
      const expectedError = 'Công thức không tồn tại';
      logCase({
        tcid: 'RCP-SVC-DE-002',
        crud: 'DELETE',
        scenario: 'lỗi công thức không tồn tại khi xóa',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getRecipeById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.deleteRecipe(input.recipeId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.deleteRecipe).not.toHaveBeenCalled();
    });

    it('RecipeService - deleteRecipe - TC-03: RCP-SVC-DE-003 - CRUD: DELETE', async () => {
      const input = { recipeId: 16 };
      const expectedError = 'Không thể xóa công thức';
      logCase({
        tcid: 'RCP-SVC-DE-003',
        crud: 'DELETE',
        scenario: 'lỗi xóa thất bại ở repository',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getRecipeById.mockResolvedValue({ id: 16 });
      RecipeRepository.deleteRecipe.mockResolvedValue(false);

      let actualError = null;
      try {
        await RecipeService.deleteRecipe(input.recipeId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });
  });

  describe('ingredient methods', () => {
    it('RecipeService - getAllIngredients - TC-01: RCP-SVC-RD-008 - CRUD: READ', async () => {
      const input = { options: { limit: 20, offset: 0, orderBy: 'name', order: 'ASC' } };
      const expected = [
        { id: 1, name: 'Đường', unit_type: 'weight', unit: 'gram' },
        { id: 2, name: 'Sữa', unit_type: 'volume', unit: 'ml' },
      ];
      logCase({
        tcid: 'RCP-SVC-RD-008',
        crud: 'READ',
        scenario: 'lấy danh sách nguyên liệu',
        input,
        expected,
      });

      RecipeRepository.getAllIngredients.mockResolvedValue(expected);

      const result = await RecipeService.getAllIngredients(input.options);
      logReality(result);

      expect(RecipeRepository.getAllIngredients).toHaveBeenCalledWith(input.options);
      expect(result).toEqual(expected);
    });

    it('RecipeService - getIngredientById - TC-01: RCP-SVC-RD-009 - CRUD: READ', async () => {
      const input = { ingredientId: 3 };
      const expected = { id: 3, name: 'Bột cacao', unit_type: 'weight', unit: 'gram' };
      logCase({
        tcid: 'RCP-SVC-RD-009',
        crud: 'READ',
        scenario: 'lấy chi tiết nguyên liệu theo id',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue(expected);

      const result = await RecipeService.getIngredientById(input.ingredientId);
      logReality(result);

      expect(RecipeRepository.getIngredientById).toHaveBeenCalledWith(3);
      expect(result).toEqual(expected);
    });

    it('RecipeService - getIngredientById - TC-02: RCP-SVC-RD-010 - CRUD: READ', async () => {
      const input = { ingredientId: 999 }; 
      const expectedError = 'Nguyên liệu không tồn tại';
      logCase({
        tcid: 'RCP-SVC-RD-010',
        crud: 'READ',
        scenario: 'lỗi nguyên liệu không tồn tại khi lấy theo id',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getIngredientById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.getIngredientById(input.ingredientId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });

    it('RecipeService - createIngredient - TC-01: RCP-SVC-CR-005 - CRUD: CREATE', async () => {
      const input = { name: 'Kem béo', unitType: 'volume', unit: 'ml' };
      const expected = { id: 20, name: 'Kem béo', unit_type: 'volume', unit: 'ml' };
      logCase({
        tcid: 'RCP-SVC-CR-005',
        crud: 'CREATE',
        scenario: 'tạo nguyên liệu mới',
        input,
        expected,
      });

      RecipeRepository.createIngredient.mockResolvedValue(expected);

      const result = await RecipeService.createIngredient(input.name, input.unitType, input.unit);
      logReality(result);

      expect(RecipeRepository.createIngredient).toHaveBeenCalledWith('Kem béo', 'volume', 'ml');
      expect(result).toEqual(expected);
    });

    it('RecipeService - updateIngredient - TC-01: RCP-SVC-UP-004 - CRUD: UPDATE', async () => {
      const input = {
        ingredientId: 4,
        name: 'Trân châu đen',
        unitType: 'weight',
        unit: 'gram',
      };
      const expected = {
        id: 4,
        name: 'Trân châu đen',
        unit_type: 'weight',
        unit: 'gram',
      };
      logCase({
        tcid: 'RCP-SVC-UP-004',
        crud: 'UPDATE',
        scenario: 'cập nhật nguyên liệu thành công',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue({ id: 4, name: 'Trân châu' });
      RecipeRepository.updateIngredient.mockResolvedValue(expected);

      const result = await RecipeService.updateIngredient(
        input.ingredientId,
        input.name,
        input.unitType,
        input.unit
      );
      logReality(result);

      expect(RecipeRepository.updateIngredient).toHaveBeenCalledWith(
        4,
        'Trân châu đen',
        'weight',
        'gram'
      );
      expect(result).toEqual(expected);
    });

    it('RecipeService - updateIngredient - TC-02: RCP-SVC-UP-005 - CRUD: UPDATE', async () => {
      const input = {
        ingredientId: 999,
        name: 'X',
        unitType: 'weight',
        unit: 'gram',
      };
      const expectedError = 'Nguyên liệu không tồn tại';
      logCase({
        tcid: 'RCP-SVC-UP-005',
        crud: 'UPDATE',
        scenario: 'lỗi nguyên liệu không tồn tại khi cập nhật',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getIngredientById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.updateIngredient(
          input.ingredientId,
          input.name,
          input.unitType,
          input.unit
        );
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.updateIngredient).not.toHaveBeenCalled();
    });

    it('RecipeService - deleteIngredient - TC-01: RCP-SVC-DE-004 - CRUD: DELETE', async () => {
      const input = { ingredientId: 8 };
      const expected = { id: 8 };
      logCase({
        tcid: 'RCP-SVC-DE-004',
        crud: 'DELETE',
        scenario: 'xóa nguyên liệu thành công',
        input,
        expected,
      });

      RecipeRepository.getIngredientById.mockResolvedValue({ id: 8, name: 'Bột matcha' });
      RecipeRepository.deleteIngredient.mockResolvedValue(true);

      const result = await RecipeService.deleteIngredient(input.ingredientId);
      logReality(result);

      expect(RecipeRepository.deleteIngredient).toHaveBeenCalledWith(8);
      expect(result).toEqual(expected);
    });

    it('RecipeService - deleteIngredient - TC-02: RCP-SVC-DE-005 - CRUD: DELETE', async () => {
      const input = { ingredientId: 999 };
      const expectedError = 'Nguyên liệu không tồn tại';
      logCase({
        tcid: 'RCP-SVC-DE-005',
        crud: 'DELETE',
        scenario: 'lỗi nguyên liệu không tồn tại khi xóa',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getIngredientById.mockResolvedValue(null);

      let actualError = null;
      try {
        await RecipeService.deleteIngredient(input.ingredientId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(RecipeRepository.deleteIngredient).not.toHaveBeenCalled();
    });

    it('RecipeService - deleteIngredient - TC-03: RCP-SVC-DE-006 - CRUD: DELETE', async () => {
      const input = { ingredientId: 9 };
      const expectedError = 'Không thể xóa nguyên liệu';
      logCase({
        tcid: 'RCP-SVC-DE-006',
        crud: 'DELETE',
        scenario: 'lỗi xóa nguyên liệu thất bại',
        input,
        expected: { error: expectedError },
      });

      RecipeRepository.getIngredientById.mockResolvedValue({ id: 9, name: 'Syrup đào' });
      RecipeRepository.deleteIngredient.mockResolvedValue(false);

      let actualError = null;
      try {
        await RecipeService.deleteIngredient(input.ingredientId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });

    it('RecipeService - searchIngredients - TC-01: RCP-SVC-RD-011 - CRUD: READ', async () => {
      const input = {
        keyword: 'sữa',
        options: { limit: 10, offset: 0 },
      };
      const expected = [
        { id: 2, name: 'Sữa tươi', unit_type: 'volume', unit: 'ml' },
        { id: 3, name: 'Sữa đặc', unit_type: 'volume', unit: 'ml' },
      ];
      logCase({
        tcid: 'RCP-SVC-RD-011',
        crud: 'READ',
        scenario: 'tìm kiếm nguyên liệu theo keyword',
        input,
        expected,
      });

      RecipeRepository.searchIngredients.mockResolvedValue(expected);

      const result = await RecipeService.searchIngredients(input.keyword, input.options);
      logReality(result);

      expect(RecipeRepository.searchIngredients).toHaveBeenCalledWith('sữa', {
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual(expected);
    });
  });
});
