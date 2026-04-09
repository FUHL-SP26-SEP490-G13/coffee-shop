const RecipeService = require('../../src/services/RecipeService');
const RecipeRepository = require('../../src/repositories/RecipeRepository');

jest.mock('../../src/repositories/RecipeRepository');

describe('RecipeService - Create Recipe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const printHeader = (title) => {
    console.log('\n' + '='.repeat(50));
    console.log(title);
    console.log('='.repeat(50));
  };

  describe('createRecipe', () => {
    it('RecipeService - CREATE_RECIPE - TC-1: should create recipe when ingredient does not exist in product size', async () => {
      printHeader('RecipeService - CREATE_RECIPE - TC-1: Tạo công thức mới thành công');

      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 25,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const mockIngredient = {
        id: 2,
        name: 'Trân châu',
        unit_type: 'weight',
        unit: 'gram',
      };
      const createdRecipe = {
        id: 101,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 25,
      };

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue(null);
      RecipeRepository.createRecipe.mockResolvedValue(createdRecipe);

      const expectedOutput = createdRecipe;
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(RecipeRepository.getIngredientById).toHaveBeenCalledWith(2);
      expect(RecipeRepository.recipeExists).toHaveBeenCalledWith(10, 2);
      expect(RecipeRepository.createRecipe).toHaveBeenCalledWith(10, 2, 25);
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it('RecipeService - CREATE_RECIPE - TC-2: should keep quantity unchanged when incoming quantity equals existing quantity', async () => {
      printHeader('RecipeService - CREATE_RECIPE - TC-2: Không cộng dồn khi số lượng không đổi');

      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 30,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

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

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue({ id: 205, quantity: 30 });
      RecipeRepository.getRecipeById.mockResolvedValue(existingRecipe);

      const expectedOutput = existingRecipe;
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(RecipeRepository.recipeExists).toHaveBeenCalledWith(10, 2);
      expect(RecipeRepository.getRecipeById).toHaveBeenCalledWith(205);
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
      expect(RecipeRepository.createRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it('RecipeService - CREATE_RECIPE - TC-3: should accumulate quantity when incoming quantity differs from existing quantity', async () => {
      printHeader('RecipeService - CREATE_RECIPE - TC-3: Cộng dồn khi số lượng mới khác số lượng hiện có');

      const input = {
        productSizeId: 10,
        ingredientId: 2,
        quantity: 5,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const mockIngredient = {
        id: 2,
        name: 'Sữa đặc',
        unit_type: 'volume',
        unit: 'ml',
      };
      const existing = { id: 305, quantity: 12 };
      const updatedRecipe = {
        id: 305,
        product_size_id: 10,
        ingredient_id: 2,
        quantity: 17,
      };

      RecipeRepository.getIngredientById.mockResolvedValue(mockIngredient);
      RecipeRepository.recipeExists.mockResolvedValue(existing);
      RecipeRepository.updateRecipe.mockResolvedValue(updatedRecipe);

      const expectedOutput = updatedRecipe;
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await RecipeService.createRecipe(
        input.productSizeId,
        input.ingredientId,
        input.quantity
      );

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(RecipeRepository.updateRecipe).toHaveBeenCalledWith(305, 2, 17);
      expect(RecipeRepository.getRecipeById).not.toHaveBeenCalled();
      expect(RecipeRepository.createRecipe).not.toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it('RecipeService - CREATE_RECIPE - TC-4: should throw error when ingredient does not exist', async () => {
      printHeader('RecipeService - CREATE_RECIPE - TC-4: Lỗi khi nguyên liệu không tồn tại');

      const input = {
        productSizeId: 10,
        ingredientId: 9999,
        quantity: 10,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      RecipeRepository.getIngredientById.mockResolvedValue(null);

      const expectedOutput = {
        error: 'Nguyên liệu không tồn tại',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      let reality;
      try {
        await RecipeService.createRecipe(
          input.productSizeId,
          input.ingredientId,
          input.quantity
        );
      } catch (error) {
        reality = { error: error.message };
      }

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(reality, null, 2));

      expect(reality).toEqual(expectedOutput);
      expect(RecipeRepository.recipeExists).not.toHaveBeenCalled();
      expect(RecipeRepository.createRecipe).not.toHaveBeenCalled();
      expect(RecipeRepository.updateRecipe).not.toHaveBeenCalled();
    });
  });
});
