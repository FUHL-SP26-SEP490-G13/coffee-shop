const FlashSaleService = require('../../src/services/FlashSaleService');
const FlashSaleRepository = require('../../src/repositories/FlashSaleRepository');

jest.mock('../../src/repositories/FlashSaleRepository');

describe('FlashSaleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentActive', () => {
    it('FlashSaleService - getCurrentActive - TC-1: should call findCurrentActive', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - getCurrentActive - TC-1: Lấy flash sale đang active');
      console.log('='.repeat(50));

      const mockResult = { id: 1, name: 'Flash Sale' };
      FlashSaleRepository.findCurrentActive.mockResolvedValue(mockResult);

      console.log('\n📝 INPUT: Không có');
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockResult, null, 2));

      const result = await FlashSaleService.getCurrentActive();

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FlashSaleRepository.findCurrentActive).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAll', () => {
    it('FlashSaleService - getAll - TC-1: should call findAll', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - getAll - TC-1: Lấy tất cả flash sales');
      console.log('='.repeat(50));

      const mockResult = [{ id: 1, name: 'Flash Sale' }];
      FlashSaleRepository.findAll.mockResolvedValue(mockResult);

      console.log('\n📝 INPUT: Không có');
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockResult, null, 2));

      const result = await FlashSaleService.getAll();

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FlashSaleRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getById', () => {
    it('FlashSaleService - getById - TC-1: should call findById', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - getById - TC-1: Lấy flash sale theo ID');
      console.log('='.repeat(50));

      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const mockResult = { id: 1, name: 'Flash Sale' };
      FlashSaleRepository.findById.mockResolvedValue(mockResult);

      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockResult, null, 2));

      const result = await FlashSaleService.getById(input.id);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(FlashSaleRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('FlashSaleService - create - TC-1: should call create', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - create - TC-1: Tạo mới flash sale');
      console.log('='.repeat(50));

      const input = { data: { name: 'New Sale' } };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const mockResult = 5;
      FlashSaleRepository.create.mockResolvedValue(mockResult);

      console.log('✅ OUTPUT EXPECT:', mockResult);

      const result = await FlashSaleService.create(input.data);

      console.log('🎯 OUTPUT REALITY:', result);

      expect(FlashSaleRepository.create).toHaveBeenCalledWith(input.data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('FlashSaleService - update - TC-1: should call update', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - update - TC-1: Cập nhật flash sale');
      console.log('='.repeat(50));

      const input = { id: 1, data: { name: 'Updated Sale' } };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FlashSaleRepository.update.mockResolvedValue(true);

      console.log('✅ OUTPUT EXPECT: true');

      const result = await FlashSaleService.update(input.id, input.data);

      console.log('🎯 OUTPUT REALITY:', result);

      expect(FlashSaleRepository.update).toHaveBeenCalledWith(1, input.data);
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('FlashSaleService - delete - TC-1: should call delete', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('FlashSaleService - delete - TC-1: Xóa flash sale');
      console.log('='.repeat(50));

      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      FlashSaleRepository.delete.mockResolvedValue(true);

      console.log('✅ OUTPUT EXPECT: true');

      const result = await FlashSaleService.delete(input.id);

      console.log('🎯 OUTPUT REALITY:', result);

      expect(FlashSaleRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
