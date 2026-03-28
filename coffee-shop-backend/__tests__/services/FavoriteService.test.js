const FavoriteService = require('../../src/services/FavoriteService');
const FavoriteRepository = require('../../src/repositories/FavoriteRepository');

jest.mock('../../src/repositories/FavoriteRepository');

describe('FavoriteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyFavorites', () => {
    it('FavoriteService - getMyFavorites - TC-1: should call repository to get favorites by user', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - getMyFavorites - TC-1: Lấy danh sách yêu thích của user');
      console.log('='.repeat(50));

      // INPUT
      const input = { userId: 10, queryParams: { page: 1, limit: 10 } };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const mockFavorites = [{ product_id: 1, name: 'Latte' }];
      FavoriteRepository.getFavoritesByUser.mockResolvedValue(mockFavorites);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockFavorites, null, 2));

      const result = await FavoriteService.getMyFavorites(input.userId, input.queryParams);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FavoriteRepository.getFavoritesByUser).toHaveBeenCalledWith(10, { page: 1, limit: 10 });
      expect(result).toEqual(mockFavorites);
    });
  });

  describe('checkFavorite', () => {
    it('FavoriteService - checkFavorite - TC-1: should return true if favorite exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - checkFavorite - TC-1: Trả về true nếu đã yêu thích');
      console.log('='.repeat(50));

      const input = { userId: 10, productId: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FavoriteRepository.findByUserAndProduct.mockResolvedValue({ id: 1 });

      console.log('✅ OUTPUT EXPECT: true');
      const result = await FavoriteService.checkFavorite(input.userId, input.productId);
      console.log('🎯 OUTPUT REALITY:', result);

      expect(result).toBe(true);
    });

    it('FavoriteService - checkFavorite - TC-2: should return false if favorite does not exist', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - checkFavorite - TC-2: Trả về false nếu chưa yêu thích');
      console.log('='.repeat(50));

      const input = { userId: 10, productId: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FavoriteRepository.findByUserAndProduct.mockResolvedValue(null);

      console.log('✅ OUTPUT EXPECT: false');
      const result = await FavoriteService.checkFavorite(input.userId, input.productId);
      console.log('🎯 OUTPUT REALITY:', result);

      expect(result).toBe(false);
    });
  });

  describe('addFavorite', () => {
    it('FavoriteService - addFavorite - TC-1: should return early if already in favorites', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - addFavorite - TC-1: Báo lỗi/bỏ qua nếu đã có trong favorites');
      console.log('='.repeat(50));

      const input = { userId: 10, productId: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FavoriteRepository.findByUserAndProduct.mockResolvedValue({ id: 1 });

      const expectedOutput = { isFavorite: true, message: 'Sản phẩm đã có trong danh sách yêu thích' };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await FavoriteService.addFavorite(input.userId, input.productId);
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FavoriteRepository.createFavorite).not.toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it('FavoriteService - addFavorite - TC-2: should create new favorite and return success message', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - addFavorite - TC-2: Thêm mới vào favorites thành công');
      console.log('='.repeat(50));

      const input = { userId: 10, productId: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FavoriteRepository.findByUserAndProduct.mockResolvedValue(null);
      FavoriteRepository.createFavorite.mockResolvedValue({ insertId: 2 });
      
      const expectedOutput = { isFavorite: true, message: 'Đã thêm vào yêu thích' };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await FavoriteService.addFavorite(input.userId, input.productId);
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FavoriteRepository.createFavorite).toHaveBeenCalledWith(10, 5);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('removeFavorite', () => {
    it('FavoriteService - removeFavorite - TC-1: should call delete favorite and return success message', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FavoriteService - removeFavorite - TC-1: Xóa yêu thích thành công');
      console.log('='.repeat(50));

      const input = { userId: 10, productId: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FavoriteRepository.deleteFavorite.mockResolvedValue(true);

      const expectedOutput = { isFavorite: false, message: 'Đã bỏ khỏi yêu thích' };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await FavoriteService.removeFavorite(input.userId, input.productId);
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FavoriteRepository.deleteFavorite).toHaveBeenCalledWith(10, 5);
      expect(result).toEqual(expectedOutput);
    });
  });
});
