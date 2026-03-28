const ReceiptSettingService = require('../../src/services/ReceiptSettingService');
const ReceiptSettingRepository = require('../../src/repositories/ReceiptSettingRepository');

jest.mock('../../src/repositories/ReceiptSettingRepository');

describe('ReceiptSettingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizePayload', () => {
    it('ReceiptSettingService - normalizePayload - TC-1: should normalize payload arrays correctly', () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - normalizePayload - TC-1: Khởi tạo/chuẩn hóa payload');
      console.log('='.repeat(50));

      const input = {
        store_name: 'Coffee Cafe',
        address: '123 Main St',
        phone: '123456789',
        header_lines: ['Line 1'],
        footer_lines: 'Invalid Type', // will be converted to []
        logo_url: 'http://example.com/logo.png',
        is_active: undefined,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const expectedOutput = {
        store_name: 'Coffee Cafe',
        address: '123 Main St',
        phone: '123456789',
        header_lines: ['Line 1'],
        footer_lines: [],
        logo_url: 'http://example.com/logo.png',
        is_active: undefined,
      };
      
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = ReceiptSettingService.normalizePayload(input);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(result).toEqual(expectedOutput);
    });
  });

  describe('mapOutput', () => {
    it('ReceiptSettingService - mapOutput - TC-1: should map output strings to arrays automatically', () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - mapOutput - TC-1: Map dữ liệu DB list/string array');
      console.log('='.repeat(50));

      const input = {
        id: 1,
        store_name: 'Store',
        header_lines: '["H1", "H2"]',
        footer_lines: null,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      const expectedOutput = {
        id: 1,
        store_name: 'Store',
        header_lines: ['H1', 'H2'],
        footer_lines: [],
      };
      
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = ReceiptSettingService.mapOutput(input);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - mapOutput - TC-2: should return null if setting is null', () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - mapOutput - TC-2: Return null nếu db = null');
      console.log('='.repeat(50));

      const input = null;
      console.log('\n📝 INPUT:', input);
      console.log('✅ OUTPUT EXPECT: null');

      const result = ReceiptSettingService.mapOutput(input);

      console.log('🎯 OUTPUT REALITY:', result);

      expect(result).toBeNull();
    });
  });

  describe('getActiveSetting', () => {
    it('ReceiptSettingService - getActiveSetting - TC-1: should find active setting and map it', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - getActiveSetting - TC-1: Lấy cấu hình in đang Active');
      console.log('='.repeat(50));

      const mockDbValue = {
        id: 2,
        store_name: 'Store 2',
        header_lines: '[]',
        footer_lines: '[]'
      };
      ReceiptSettingRepository.findActive.mockResolvedValue(mockDbValue);

      const expectedOutput = {
        id: 2,
        store_name: 'Store 2',
        header_lines: [],
        footer_lines: []
      };
      
      console.log('\n📝 INPUT: Không có');
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await ReceiptSettingService.getActiveSetting();

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(ReceiptSettingRepository.findActive).toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('upsertActiveSetting', () => {
    it('ReceiptSettingService - upsertActiveSetting - TC-1: should create new active setting if none exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - upsertActiveSetting - TC-1: Tạo mới config In hóa đơn');
      console.log('='.repeat(50));

      const input = { store_name: 'New Store' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      ReceiptSettingRepository.findActive.mockResolvedValue(null);
      ReceiptSettingRepository.create.mockResolvedValue({
        id: 3,
        store_name: 'New Store',
      });

      const expectedOutput = { id: 3, store_name: 'New Store', header_lines: [], footer_lines: [] };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await ReceiptSettingService.upsertActiveSetting(input);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(ReceiptSettingRepository.deactivateAll).toHaveBeenCalledWith();
      expect(ReceiptSettingRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        store_name: 'New Store',
        is_active: true,
      }));
      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - upsertActiveSetting - TC-2: should update existing active setting if one exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('ReceiptSettingService - upsertActiveSetting - TC-2: Cập nhật config In hóa đơn');
      console.log('='.repeat(50));

      const input = { store_name: 'Updated Store' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      ReceiptSettingRepository.findActive.mockResolvedValue({ id: 5, store_name: 'Old Store' });
      ReceiptSettingRepository.updateById.mockResolvedValue({
        id: 5,
        store_name: 'Updated Store',
      });

      const expectedOutput = { id: 5, store_name: 'Updated Store', header_lines: [], footer_lines: [] };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await ReceiptSettingService.upsertActiveSetting(input);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(ReceiptSettingRepository.updateById).toHaveBeenCalledWith(5, expect.objectContaining({
        store_name: 'Updated Store',
        is_active: true,
      }));
      expect(ReceiptSettingRepository.deactivateAll).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedOutput);
    });
  });
});
