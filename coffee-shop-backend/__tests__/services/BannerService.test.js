const BannerService = require('../../src/services/BannerService');
const BannerRepository = require('../../src/repositories/BannerRepository');

// Mock dependencies
jest.mock('../../src/repositories/BannerRepository');

describe('BannerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET ACTIVE BANNER TESTS ==========
  describe('getActive', () => {
    it('BannerService - GET_ACTIVE - TC-1: should get active banner', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - GET_ACTIVE - TC-1: Lấy banner đang active');
      console.log('='.repeat(50));

      // Arrange
      const mockBanner = {
        id: 1,
        title: 'Khuyến mãi mùa hè',
        image_url: 'banner.jpg',
        is_active: 1,
      };
      BannerRepository.findActive.mockResolvedValue(mockBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Active banner object');

      // Act
      const result = await BannerService.getActive();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.findActive).toHaveBeenCalled();
      expect(result.is_active).toBe(1);
    });
  });

  // ========== GET ALL BANNERS TESTS ==========
  describe('getAll', () => {
    it('BannerService - GET_ALL - TC-1: should get all banners', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - GET_ALL - TC-1: Lấy tất cả banner');
      console.log('='.repeat(50));

      // INPUT
      const input = { page: 1, limit: 10 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockBanners = [
        { id: 1, title: 'Banner 1', is_active: 1 },
        { id: 2, title: 'Banner 2', is_active: 0 },
      ];
      BannerRepository.findAll.mockResolvedValue(mockBanners);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of all banners');

      // Act
      const result = await BannerService.getAll(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.findAll).toHaveBeenCalledWith(input);
      expect(result).toHaveLength(2);
    });
  });

  // ========== CREATE BANNER TESTS ==========
  describe('create', () => {
    it('BannerService - CREATE - TC-1: should create banner and deactivate others', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - CREATE - TC-1: Tạo banner và deactivate banner khác');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        title: 'New Banner',
        image_url: 'new-banner.jpg',
        link: '/promotion',
        is_active: true,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      BannerRepository.deactivateAll.mockResolvedValue(true);
      const mockCreatedBanner = { id: 3, ...input };
      BannerRepository.create.mockResolvedValue(mockCreatedBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created banner, other banners deactivated');

      // Act
      const result = await BannerService.create(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.deactivateAll).toHaveBeenCalled();
      expect(BannerRepository.create).toHaveBeenCalledWith(input);
      expect(result.id).toBe(3);
    });

    it('BannerService - CREATE - TC-2: should create inactive banner without deactivating others', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - CREATE - TC-2: Tạo banner inactive không deactivate banner khác');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        title: 'Inactive Banner',
        image_url: 'inactive.jpg',
        is_active: false,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockCreatedBanner = { id: 4, ...input };
      BannerRepository.create.mockResolvedValue(mockCreatedBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created inactive banner');

      // Act
      const result = await BannerService.create(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.deactivateAll).not.toHaveBeenCalled();
      expect(BannerRepository.create).toHaveBeenCalledWith(input);
    });
  });

  // ========== UPDATE BANNER TESTS ==========
  describe('update', () => {
    it('BannerService - UPDATE - TC-1: should update banner and deactivate others', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - UPDATE - TC-1: Cập nhật banner và deactivate banner khác');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        title: 'Updated Banner',
        is_active: true,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      BannerRepository.deactivateAll.mockResolvedValue(true);
      const mockUpdatedBanner = { id: 1, title: 'Updated Banner', is_active: 1 };
      BannerRepository.update.mockResolvedValue(mockUpdatedBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Updated banner, others deactivated');

      // Act
      const result = await BannerService.update(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.deactivateAll).toHaveBeenCalled();
      expect(BannerRepository.update).toHaveBeenCalledWith(1, input);
      expect(result.title).toBe('Updated Banner');
    });

    it('BannerService - UPDATE - TC-2: should update to inactive without affecting others', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - UPDATE - TC-2: Cập nhật thành inactive không ảnh hưởng banner khác');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        is_active: false,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockUpdatedBanner = { id: 1, is_active: 0 };
      BannerRepository.update.mockResolvedValue(mockUpdatedBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Banner updated to inactive');

      // Act
      const result = await BannerService.update(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.deactivateAll).not.toHaveBeenCalled();
      expect(BannerRepository.update).toHaveBeenCalledWith(1, input);
    });
  });

  // ========== DELETE BANNER TESTS ==========
  describe('delete', () => {
    it('BannerService - DELETE - TC-1: should delete banner successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - DELETE - TC-1: Xóa banner thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      BannerRepository.delete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Banner deleted');

      // Act
      const result = await BannerService.delete(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(BannerRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  // ========== GET BANNER BY ID TESTS ==========
  describe('getById', () => {
    it('BannerService - GET_BY_ID - TC-1: should get banner by ID', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('BannerService - GET_BY_ID - TC-1: Lấy banner theo ID');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockBanner = { id: 1, title: 'Banner 1', is_active: 1 };
      BannerRepository.findById.mockResolvedValue(mockBanner);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Banner with id = 1');

      // Act
      const result = await BannerService.getById(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(BannerRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });
});
