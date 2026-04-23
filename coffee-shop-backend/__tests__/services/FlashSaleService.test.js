const FlashSaleService = require('../../src/services/FlashSaleService');
const FlashSaleRepository = require('../../src/repositories/FlashSaleRepository');
const { logTestCase } = require('../utils/logger');

jest.mock('../../src/repositories/FlashSaleRepository');

describe('FlashSaleService', () => {
  let pendingLog = null;

  const logCase = (name, input, expected) => {
    pendingLog = { name, input, expected };
  };

  const logReality = (actual) => {
    if (!pendingLog) return;
    logTestCase({ ...pendingLog, actual });
    pendingLog = null;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    pendingLog = null;
  });

  describe('getCurrentActive', () => {
    it('FlashSaleService - getCurrentActive - TC-01: should call findCurrentActive', async () => {
      const expected = { id: 1, title: 'Flash Sale' };
      FlashSaleRepository.findCurrentActive.mockResolvedValue(expected);
      logCase('FlashSaleService - getCurrentActive - TC-01: should call findCurrentActive', {}, expected);

      const result = await FlashSaleService.getCurrentActive();
      logReality(result);

      expect(FlashSaleRepository.findCurrentActive).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });
  });

  describe('getAll', () => {
    it('FlashSaleService - getAll - TC-01: should call findAll', async () => {
      const expected = [{ id: 1, title: 'Flash Sale 1' }];
      FlashSaleRepository.findAll.mockResolvedValue(expected);
      logCase('FlashSaleService - getAll - TC-01: should call findAll', {}, expected);

      const result = await FlashSaleService.getAll();
      logReality(result);

      expect(FlashSaleRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });
  });

  describe('getById', () => {
    it('FlashSaleService - getById - TC-01: should call findById', async () => {
      const input = { id: 1 };
      const expected = { id: 1, title: 'Flash Sale 1' };
      FlashSaleRepository.findById.mockResolvedValue(expected);
      logCase('FlashSaleService - getById - TC-01: should call findById', input, expected);

      const result = await FlashSaleService.getById(input.id);
      logReality(result);

      expect(FlashSaleRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('FlashSaleService - create - TC-01: should call create when no overlap', async () => {
      const input = {
        title: 'Flash sáng',
        status: 'active',
        start_time: '2026-04-14T10:00:00.000Z',
        end_time: '2026-04-14T12:00:00.000Z',
        discount_percent: 15,
      };
      const expected = 5;

      FlashSaleRepository.checkOverlap.mockResolvedValue(null);
      FlashSaleRepository.create.mockResolvedValue(expected);
      logCase('FlashSaleService - create - TC-01: should call create when no overlap', input, expected);

      const result = await FlashSaleService.create(input);
      logReality(result);

      expect(FlashSaleRepository.checkOverlap).toHaveBeenCalledWith(input.start_time, input.end_time);
      expect(FlashSaleRepository.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });

    it('FlashSaleService - create - TC-02: should throw error when active campaign time overlaps', async () => {
      const input = {
        title: 'Overlap campaign',
        status: 'active',
        start_time: '2026-04-14T10:00:00.000Z',
        end_time: '2026-04-14T12:00:00.000Z',
      };
      const expected = 'Không thể tạo. Bị trùng khung giờ với chiến dịch đang chạy: "Flash trùng giờ"';

      FlashSaleRepository.checkOverlap.mockResolvedValue({ title: 'Flash trùng giờ' });
      logCase('FlashSaleService - create - TC-02: should throw error when active campaign time overlaps', input, expected);

      await expect(FlashSaleService.create(input)).rejects.toThrow(expected);
      logReality(expected);

      expect(FlashSaleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('FlashSaleService - update - TC-01: should call update', async () => {
      const input = {
        id: 1,
        data: {
          title: 'Flash đã cập nhật',
          status: 'active',
          start_time: '2026-04-14T13:00:00.000Z',
          end_time: '2026-04-14T15:00:00.000Z',
          discount_percent: 20,
        },
      };
      const expected = true;

      FlashSaleRepository.checkOverlap.mockResolvedValue(null);
      FlashSaleRepository.update.mockResolvedValue(expected);
      logCase('FlashSaleService - update - TC-01: should call update', input, expected);

      const result = await FlashSaleService.update(input.id, input.data);
      logReality(result);

      expect(FlashSaleRepository.checkOverlap).toHaveBeenCalledWith(
        input.data.start_time,
        input.data.end_time,
        input.id
      );
      expect(FlashSaleRepository.update).toHaveBeenCalledWith(input.id, input.data);
      expect(result).toBe(true);
    });

    it('FlashSaleService - update - TC-02: should throw error when active campaign time overlaps', async () => {
      const input = {
        id: 1,
        data: {
          title: 'Flash bị trùng',
          status: 'active',
          start_time: '2026-04-14T10:00:00.000Z',
          end_time: '2026-04-14T12:00:00.000Z',
          discount_percent: 10,
        },
      };
      const expected = 'Không thể cập nhật. Bị trùng khung giờ với chiến dịch đang chạy: "Flash trùng giờ"';

      FlashSaleRepository.checkOverlap.mockResolvedValue({ title: 'Flash trùng giờ' });
      logCase('FlashSaleService - update - TC-02: should throw error when active campaign time overlaps', input, expected);

      await expect(FlashSaleService.update(input.id, input.data)).rejects.toThrow(expected);
      logReality(expected);

      expect(FlashSaleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('FlashSaleService - delete - TC-01: should call delete', async () => {
      const input = { id: 1 };
      const expected = true;

      FlashSaleRepository.delete.mockResolvedValue(expected);
      logCase('FlashSaleService - delete - TC-01: should call delete', input, expected);

      const result = await FlashSaleService.delete(input.id);
      logReality(result);

      expect(FlashSaleRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
