const TableService = require('../../src/services/TableService');
const TableRepository = require('../../src/repositories/TableRepository');
const AreaRepository = require('../../src/repositories/AreaRepository');
const LoyaltyService = require('../../src/services/LoyaltyService');

jest.mock('../../src/repositories/TableRepository');
jest.mock('../../src/repositories/AreaRepository');
jest.mock('../../src/services/LoyaltyService');

describe('TableService', () => {
  const printDivider = () => {
    console.log('\n' + '='.repeat(50));
  };

  const logCase = ({ title, input, expected, reality }) => {
    printDivider();
    console.log(title);
    printDivider();

    if (input !== undefined) {
      console.log('\nINPUT:', JSON.stringify(input, null, 2));
    }
    if (expected !== undefined) {
      console.log('OUTPUT EXPECT:', JSON.stringify(expected, null, 2));
    }
    if (reality !== undefined) {
      console.log('OUTPUT REALITY:', JSON.stringify(reality, null, 2));
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TableRepository.db = {
      query: jest.fn(),
    };
    LoyaltyService.syncOrderLoyaltyByOrderId.mockResolvedValue(true);
  });

  describe('getAllTables', () => {
    it('TableService - getAllTables - TC-01: should return all tables when no status filter', async () => {
      const input = {};
      const rows = [
        { id: 1, code: 'TB-01', status: 'available', area_name: 'A' },
        { id: 2, code: 'TB-02', status: 'occupied', area_name: 'A' },
      ];
      TableRepository.db.query.mockResolvedValue([rows]);

      const result = await TableService.getAllTables();

      logCase({
        title: 'TableService - getAllTables - TC-01',
        input,
        expected: rows,
        reality: result,
      });

      expect(TableRepository.db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE t.is_deleted = 0'), []);
      expect(result).toEqual(rows);
    });

    it('TableService - getAllTables - TC-02: should append status filter when status is provided', async () => {
      const input = { status: 'available' };
      const rows = [{ id: 1, code: 'TB-01', status: 'available' }];
      TableRepository.db.query.mockResolvedValue([rows]);

      const result = await TableService.getAllTables(input);

      logCase({
        title: 'TableService - getAllTables - TC-02',
        input,
        expected: rows,
        reality: result,
      });

      const [query, params] = TableRepository.db.query.mock.calls[0];
      expect(query).toContain('AND t.status = ?');
      expect(params).toEqual(['available']);
      expect(result).toEqual(rows);
    });
  });

  describe('getTableById', () => {
    it('TableService - getTableById - TC-01: should return table when table exists and not deleted', async () => {
      const input = { id: 10 };
      const table = { id: 10, code: 'TB-10', is_deleted: 0 };
      TableRepository.findById.mockResolvedValue(table);

      const result = await TableService.getTableById(input.id);

      logCase({
        title: 'TableService - getTableById - TC-01',
        input,
        expected: table,
        reality: result,
      });

      expect(TableRepository.findById).toHaveBeenCalledWith(10);
      expect(result).toEqual(table);
    });

    it('TableService - getTableById - TC-02: should throw 404 when table is not found', async () => {
      const input = { id: 999 };
      const expectedError = 'Bàn không tồn tại';
      let actualError = null;

      TableRepository.findById.mockResolvedValue(null);

      try {
        await TableService.getTableById(input.id);
      } catch (error) {
        actualError = error.message;
      }

      logCase({
        title: 'TableService - getTableById - TC-02',
        input,
        expected: expectedError,
        reality: actualError,
      });

      expect(actualError).toBe(expectedError);
    });

    it('TableService - getTableById - TC-03: should throw 404 when table is soft deleted', async () => {
      const input = { id: 2 };
      const expectedError = 'Bàn không tồn tại';
      let actualError = null;

      TableRepository.findById.mockResolvedValue({ id: 2, is_deleted: 1 });

      try {
        await TableService.getTableById(input.id);
      } catch (error) {
        actualError = error.message;
      }

      logCase({
        title: 'TableService - getTableById - TC-03',
        input,
        expected: expectedError,
        reality: actualError,
      });

      expect(actualError).toBe(expectedError);
    });
  });

  describe('createTable', () => {
    it('TableService - createTable - TC-01: should auto generate next code and use default seatNumber', async () => {
      const input = { area_id: 1 };
      const expected = { id: 20, code: 'TB-10', seatNumber: 4, area_id: 1 };

      AreaRepository.findById.mockResolvedValue({ id: 1, name: 'Area 1' });
      TableRepository.db.query.mockResolvedValueOnce([[{ code: 'TB-09' }]]);
      TableRepository.create.mockResolvedValue(expected);

      const result = await TableService.createTable(input);

      logCase({
        title: 'TableService - createTable - TC-01',
        input,
        expected,
        reality: result,
      });

      expect(TableRepository.create).toHaveBeenCalledWith({
        code: 'TB-10',
        seatNumber: 4,
        area_id: 1,
        status: 'available',
        is_deleted: 0,
      });
      expect(result).toEqual(expected);
    });

    it('TableService - createTable - TC-02: should start from TB-01 when there is no previous table code', async () => {
      const input = { area_id: 1, seatNumber: 6 };
      const expected = { id: 1, code: 'TB-01', seatNumber: 6, area_id: 1 };

      AreaRepository.findById.mockResolvedValue({ id: 1, name: 'Area 1' });
      TableRepository.db.query.mockResolvedValueOnce([[]]);
      TableRepository.create.mockResolvedValue(expected);

      const result = await TableService.createTable(input);

      logCase({
        title: 'TableService - createTable - TC-02',
        input,
        expected,
        reality: result,
      });

      expect(TableRepository.create).toHaveBeenCalledWith({
        code: 'TB-01',
        seatNumber: 6,
        area_id: 1,
        status: 'available',
        is_deleted: 0,
      });
      expect(result).toEqual(expected);
    });

    it('TableService - createTable - TC-03: should throw 404 when area does not exist', async () => {
      const input = { area_id: 999 };
      const expectedError = 'Khu vực không tồn tại';
      let actualError = null;

      AreaRepository.findById.mockResolvedValue(null);

      try {
        await TableService.createTable(input);
      } catch (error) {
        actualError = error.message;
      }

      logCase({
        title: 'TableService - createTable - TC-03',
        input,
        expected: expectedError,
        reality: actualError,
      });

      expect(actualError).toBe(expectedError);
      expect(TableRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateTable', () => {
    it('TableService - updateTable - TC-01: should update table normally when status is not set to available', async () => {
      const input = { id: 1, payload: { area_id: 2, seatNumber: 8 } };
      const expected = { id: 1, area_id: 2, seatNumber: 8 };

      TableRepository.findById.mockResolvedValue({ id: 1, code: 'TB-01', is_deleted: 0 });
      AreaRepository.findById.mockResolvedValue({ id: 2, name: 'Area 2' });
      TableRepository.update.mockResolvedValue(expected);

      const result = await TableService.updateTable(input.id, input.payload);

      logCase({
        title: 'TableService - updateTable - TC-01',
        input,
        expected,
        reality: result,
      });

      expect(AreaRepository.findById).toHaveBeenCalledWith(2);
      expect(TableRepository.update).toHaveBeenCalledWith(1, input.payload);
      expect(result).toEqual(expected);
    });

    it('TableService - updateTable - TC-02: should complete pending and processing orders when setting status to available', async () => {
      const input = { id: 1, payload: { status: 'available' } };
      const expected = {
        id: 1,
        status: 'available',
        current_session_id: null,
        loyaltySyncCalls: 2,
      };

      TableRepository.findById.mockResolvedValue({ id: 1, code: 'TB-01', is_deleted: 0 });
      TableRepository.db.query
        .mockResolvedValueOnce([[{ id: 101 }, { id: 102 }]])
        .mockResolvedValueOnce([{}]);
      TableRepository.update.mockResolvedValue({ id: 1, status: 'available', current_session_id: null });

      const result = await TableService.updateTable(input.id, input.payload);

      logCase({
        title: 'TableService - updateTable - TC-02',
        input,
        expected,
        reality: {
          ...result,
          loyaltySyncCalls: LoyaltyService.syncOrderLoyaltyByOrderId.mock.calls.length,
        },
      });

      expect(TableRepository.db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id'),
        [1]
      );
      expect(TableRepository.db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE orders SET status = 'completed'"),
        [1]
      );
      expect(LoyaltyService.syncOrderLoyaltyByOrderId).toHaveBeenCalledTimes(2);
      expect(LoyaltyService.syncOrderLoyaltyByOrderId).toHaveBeenNthCalledWith(1, 101);
      expect(LoyaltyService.syncOrderLoyaltyByOrderId).toHaveBeenNthCalledWith(2, 102);
      expect(TableRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'available', current_session_id: null })
      );
      expect(result).toEqual({ id: 1, status: 'available', current_session_id: null });
    });

    it('TableService - updateTable - TC-03: should throw 404 when updating to an area that does not exist', async () => {
      const input = { id: 1, payload: { area_id: 999 } };
      const expectedError = 'Khu vực không tồn tại';
      let actualError = null;

      TableRepository.findById.mockResolvedValue({ id: 1, code: 'TB-01', is_deleted: 0 });
      AreaRepository.findById.mockResolvedValue(null);

      try {
        await TableService.updateTable(input.id, input.payload);
      } catch (error) {
        actualError = error.message;
      }

      logCase({
        title: 'TableService - updateTable - TC-03',
        input,
        expected: expectedError,
        reality: actualError,
      });

      expect(actualError).toBe(expectedError);
      expect(TableRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTable', () => {
    it('TableService - deleteTable - TC-01: should append deleted suffix to code then soft delete', async () => {
      const input = { id: 1 };
      const expected = { id: 1, is_deleted: 1 };

      TableRepository.findById.mockResolvedValue({ id: 1, code: 'TB-01', is_deleted: 0 });
      TableRepository.update.mockResolvedValue({ id: 1, code: 'TB-01-del-1' });
      TableRepository.softDelete.mockResolvedValue(expected);

      const result = await TableService.deleteTable(input.id);

      logCase({
        title: 'TableService - deleteTable - TC-01',
        input,
        expected,
        reality: result,
      });

      expect(TableRepository.update).toHaveBeenCalledWith(1, { code: 'TB-01-del-1' });
      expect(TableRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('getTablesByArea', () => {
    it('TableService - getTablesByArea - TC-01: should return tables of a specific area', async () => {
      const input = { areaId: 2 };
      const rows = [
        { id: 1, area_id: 2, code: 'TB-01' },
        { id: 2, area_id: 2, code: 'TB-02' },
      ];
      TableRepository.findByAreaId.mockResolvedValue(rows);

      const result = await TableService.getTablesByArea(input.areaId);

      logCase({
        title: 'TableService - getTablesByArea - TC-01',
        input,
        expected: rows,
        reality: result,
      });

      expect(TableRepository.findByAreaId).toHaveBeenCalledWith(2);
      expect(result).toEqual(rows);
    });
  });
});
