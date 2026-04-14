const ReceiptSettingService = require('../../src/services/ReceiptSettingService');
const ReceiptSettingRepository = require('../../src/repositories/ReceiptSettingRepository');

const { logTestCase } = require('../utils/logger');

jest.mock('../../src/repositories/ReceiptSettingRepository');

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

describe('ReceiptSettingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizePayload', () => {
    it('ReceiptSettingService - normalizePayload - TC-01: chuẩn hóa payload đầy đủ', () => {
      const input = {
        store_name: 'Coffee Cafe',
        address: '123 Main St',
        phone: '123456789',
        header_lines: ['Line 1'],
        footer_lines: 'invalid',
        logo_url: 'http://example.com/logo.png',
        is_active: true,
        open_time: '06:30',
        close_time: '22:00',
        reputation_rules: [{ min_points: 0, max_points: 100, label: 'Mới' }],
      };

      const expectedOutput = {
        store_name: 'Coffee Cafe',
        address: '123 Main St',
        phone: '123456789',
        header_lines: ['Line 1'],
        footer_lines: [],
        logo_url: 'http://example.com/logo.png',
        is_active: true,
        open_time: '06:30',
        close_time: '22:00',
        reputation_rules: [{ min_points: 0, max_points: 100, label: 'Mới' }],
      };

      logCase({
        method: 'normalizePayload',
        tcid: 'TC-01',
        crud: 'TRANSFORM',
        input,
        outputExpect: 'Payload được chuẩn hóa đúng theo schema service',
      });

      const result = ReceiptSettingService.normalizePayload(input);
      logReality(result);

      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - normalizePayload - TC-02: address khoảng trắng sẽ về null', () => {
      const input = {
        store_name: 'Coffee Cafe',
        address: '    ',
      };

      const expectedOutput = {
        store_name: 'Coffee Cafe',
        address: null,
        phone: undefined,
        header_lines: undefined,
        footer_lines: undefined,
        logo_url: undefined,
        is_active: undefined,
        open_time: undefined,
        close_time: undefined,
        reputation_rules: undefined,
      };

      logCase({
        method: 'normalizePayload',
        tcid: 'TC-02',
        crud: 'TRANSFORM',
        input,
        outputExpect: 'Chuỗi khoảng trắng được normalize về null',
      });

      const result = ReceiptSettingService.normalizePayload(input);
      logReality(result);

      expect(result).toEqual(expectedOutput);
    });
  });

  describe('mapOutput', () => {
    it('ReceiptSettingService - mapOutput - TC-01: map string JSON sang mảng và giữ reputation_rules string', () => {
      const input = {
        id: 1,
        store_name: 'Store',
        header_lines: '["H1", "H2"]',
        footer_lines: null,
        reputation_rules: '[]',
      };

      const expectedOutput = {
        id: 1,
        store_name: 'Store',
        header_lines: ['H1', 'H2'],
        footer_lines: [],
        reputation_rules: '[]',
      };

      logCase({
        method: 'mapOutput',
        tcid: 'TC-01',
        crud: 'TRANSFORM',
        input,
        expected: expectedOutput,
      });

      const result = ReceiptSettingService.mapOutput(input);
      logReality(result);

      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - mapOutput - TC-02: thêm reputation_rules mặc định khi không có từ DB', () => {
      const input = {
        id: 2,
        store_name: 'Store 2',
        header_lines: '[]',
        footer_lines: '[]',
      };

      const expectedOutput = {
        id: 2,
        store_name: 'Store 2',
        header_lines: [],
        footer_lines: [],
        reputation_rules: '[]',
      };

      logCase({
        method: 'mapOutput',
        tcid: 'TC-02',
        crud: 'TRANSFORM',
        input,
        expected: expectedOutput,
      });

      const result = ReceiptSettingService.mapOutput(input);
      logReality(result);

      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - mapOutput - TC-03: map reputation_rules object sang string JSON', () => {
      const input = {
        id: 3,
        store_name: 'Store 3',
        header_lines: [],
        footer_lines: [],
        reputation_rules: [{ min_points: 0, max_points: 100, label: 'Mới' }],
      };

      const expectedOutput = {
        id: 3,
        store_name: 'Store 3',
        header_lines: [],
        footer_lines: [],
        reputation_rules: '[{"min_points":0,"max_points":100,"label":"Mới"}]',
      };

      logCase({
        method: 'mapOutput',
        tcid: 'TC-03',
        crud: 'TRANSFORM',
        input,
        expected: expectedOutput,
      });

      const result = ReceiptSettingService.mapOutput(input);
      logReality(result);

      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - mapOutput - TC-04: trả về null khi input null', () => {
      const input = null;

      logCase({
        method: 'mapOutput',
        tcid: 'TC-04',
        crud: 'TRANSFORM',
        input,
        outputExpect: 'Trả về null khi setting không tồn tại',
      });

      const result = ReceiptSettingService.mapOutput(input);
      logReality(result);

      expect(result).toBeNull();
    });

    it('ReceiptSettingService - mapOutput - TC-05: throw lỗi khi header_lines JSON không hợp lệ', () => {
      const input = {
        id: 10,
        header_lines: 'not-json',
        footer_lines: '[]',
      };

      logCase({
        method: 'mapOutput',
        tcid: 'TC-05',
        crud: 'TRANSFORM',
        input,
        outputExpect: 'Ném lỗi parse JSON khi header_lines sai định dạng',
      });

      let actualError = null;
      try {
        ReceiptSettingService.mapOutput(input);
      } catch (error) {
        actualError = error;
      }

      logReality({
        name: actualError?.name,
        message: actualError?.message,
      });

      expect(actualError).toBeInstanceOf(Error);
    });
  });

  describe('getActiveSetting', () => {
    it('ReceiptSettingService - getActiveSetting - TC-01: lấy cấu hình active và map đúng dữ liệu', async () => {
      const mockDbValue = {
        id: 2,
        store_name: 'Store 2',
        header_lines: '[]',
        footer_lines: '[]',
      };

      const expectedOutput = {
        id: 2,
        store_name: 'Store 2',
        header_lines: [],
        footer_lines: [],
        reputation_rules: '[]',
      };

      ReceiptSettingRepository.findActive.mockResolvedValue(mockDbValue);

      logCase({
        method: 'getActiveSetting',
        tcid: 'TC-01',
        crud: 'READ',
        input: null,
        expected: expectedOutput,
      });

      const result = await ReceiptSettingService.getActiveSetting();
      logReality(result);

      expect(ReceiptSettingRepository.findActive).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('upsertActiveSetting', () => {
    it('ReceiptSettingService - upsertActiveSetting - TC-01: tạo mới khi chưa có setting active', async () => {
      const input = {
        store_name: 'New Store',
        reputation_rules: [{ min_points: 0, max_points: 100, label: 'Mới' }],
      };

      ReceiptSettingRepository.findActive.mockResolvedValue(null);
      ReceiptSettingRepository.create.mockResolvedValue({
        id: 3,
        store_name: 'New Store',
        header_lines: '[]',
        footer_lines: '[]',
        reputation_rules: '[{"min_points":0,"max_points":100,"label":"Mới"}]',
      });

      const expectedOutput = {
        id: 3,
        store_name: 'New Store',
        header_lines: [],
        footer_lines: [],
        reputation_rules: '[{"min_points":0,"max_points":100,"label":"Mới"}]',
      };

      logCase({
        method: 'upsertActiveSetting',
        tcid: 'TC-01',
        crud: 'UPSERT',
        input,
        expected: expectedOutput,
      });

      const result = await ReceiptSettingService.upsertActiveSetting(input);
      logReality(result);

      expect(ReceiptSettingRepository.deactivateAll).toHaveBeenCalledWith();
      expect(ReceiptSettingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          store_name: 'New Store',
          is_active: true,
          reputation_rules: [{ min_points: 0, max_points: 100, label: 'Mới' }],
        })
      );
      expect(result).toEqual(expectedOutput);
    });

    it('ReceiptSettingService - upsertActiveSetting - TC-02: cập nhật khi đã có setting active', async () => {
      const input = {
        store_name: 'Updated Store',
        address: '   ',
        reputation_rules: '[]',
      };

      ReceiptSettingRepository.findActive.mockResolvedValue({ id: 5, store_name: 'Old Store' });
      ReceiptSettingRepository.updateById.mockResolvedValue({
        id: 5,
        store_name: 'Updated Store',
        header_lines: '[]',
        footer_lines: '[]',
        reputation_rules: '[]',
      });

      const expectedOutput = {
        id: 5,
        store_name: 'Updated Store',
        header_lines: [],
        footer_lines: [],
        reputation_rules: '[]',
      };

      logCase({
        method: 'upsertActiveSetting',
        tcid: 'TC-02',
        crud: 'UPSERT',
        input,
        expected: expectedOutput,
      });

      const result = await ReceiptSettingService.upsertActiveSetting(input);
      logReality(result);

      expect(ReceiptSettingRepository.updateById).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          store_name: 'Updated Store',
          address: null,
          is_active: true,
          reputation_rules: '[]',
        })
      );
      expect(ReceiptSettingRepository.deactivateAll).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedOutput);
    });
  });
});
