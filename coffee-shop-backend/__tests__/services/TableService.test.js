const TableService = require('../../src/services/TableService');
const TableRepository = require('../../src/repositories/TableRepository');
const AreaRepository = require('../../src/repositories/AreaRepository');

// Mock dependencies
jest.mock('../../src/repositories/TableRepository');
jest.mock('../../src/repositories/AreaRepository');

describe('TableService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET ALL TABLES TESTS ==========
  describe('getAllTables', () => {
    it('TableService - GET_ALL - TC-1: should get all tables with area info', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_ALL - TC-1: Lấy tất cả bàn kèm thông tin khu vực');
      console.log('='.repeat(50));

      // Arrange
      const mockTables = [
        { id: 1, table_number: 1, area_id: 1, area_name: 'Khu A', status: 'available', is_deleted: 0 },
        { id: 2, table_number: 2, area_id: 1, area_name: 'Khu A', status: 'occupied', is_deleted: 0 },
      ];
      TableRepository.db = {
        query: jest.fn().mockResolvedValue([mockTables]),
      };

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of tables with area names');

      // Act
      const result = await TableService.getAllTables();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(TableRepository.db.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('area_name');
    });

    it('TableService - GET_ALL - TC-2: should filter tables by status', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_ALL - TC-2: Lọc bàn theo trạng thái');
      console.log('='.repeat(50));

      // INPUT
      const input = { status: 'available' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockAvailableTables = [
        { id: 1, table_number: 1, status: 'available' },
      ];
      TableRepository.db = {
        query: jest.fn().mockResolvedValue([mockAvailableTables]),
      };

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Only available tables');

      // Act
      const result = await TableService.getAllTables(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(TableRepository.db.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('available');
    });
  });

  // ========== GET TABLE BY ID TESTS ==========
  describe('getTableById', () => {
    it('TableService - GET_BY_ID - TC-1: should get table by ID successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_BY_ID - TC-1: Lấy bàn theo ID thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockTable = { id: 1, table_number: 1, area_id: 1, is_deleted: 0 };
      TableRepository.findById.mockResolvedValue(mockTable);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Table with id = 1');

      // Act
      const result = await TableService.getTableById(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(TableRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('TableService - GET_BY_ID - TC-2: should throw error when table not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_BY_ID - TC-2: Lỗi khi bàn không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      TableRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Bàn không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(TableService.getTableById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);
    });

    it('TableService - GET_BY_ID - TC-3: should throw error when table is deleted', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_BY_ID - TC-3: Lỗi khi bàn đã bị xóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockDeletedTable = { id: 1, table_number: 1, is_deleted: 1 };
      TableRepository.findById.mockResolvedValue(mockDeletedTable);

      // OUTPUT EXPECT
      const expectedError = 'Bàn không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(TableService.getTableById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);
    });
  });

  // ========== CREATE TABLE TESTS ==========
  describe('createTable', () => {
    it('TableService - CREATE - TC-1: should create table successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - CREATE - TC-1: Tạo bàn thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        table_number: 5,
        area_id: 1,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(mockArea);
      TableRepository.existsInArea.mockResolvedValue(false);
      const mockCreatedTable = { id: 5, table_number: 5, area_id: 1, status: 'available' };
      TableRepository.create.mockResolvedValue(mockCreatedTable);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created table with id = 5');

      // Act
      const result = await TableService.createTable(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.findById).toHaveBeenCalledWith(1);
      expect(TableRepository.existsInArea).toHaveBeenCalledWith(5, 1);
      expect(TableRepository.create).toHaveBeenCalledWith({
        table_number: 5,
        area_id: 1,
        status: 'available',
        is_deleted: 0,
      });
      expect(result.id).toBe(5);
    });

    it('TableService - CREATE - TC-2: should throw error when area not exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - CREATE - TC-2: Lỗi khi khu vực không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        table_number: 5,
        area_id: 999,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AreaRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Khu vực không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(TableService.createTable(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(TableRepository.create).not.toHaveBeenCalled();
    });

    it('TableService - CREATE - TC-3: should throw error when table number exists in area', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - CREATE - TC-3: Lỗi khi số bàn đã tồn tại trong khu vực');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        table_number: 1,
        area_id: 1,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(mockArea);
      TableRepository.existsInArea.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Bàn số 1 đã tồn tại trong khu vực này';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(TableService.createTable(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(TableRepository.create).not.toHaveBeenCalled();
    });
  });

  // ========== UPDATE TABLE TESTS ==========
  describe('updateTable', () => {
    it('TableService - UPDATE - TC-1: should update table successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - UPDATE - TC-1: Cập nhật bàn thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        table_number: 10,
        area_id: 1,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingTable = { id: 1, table_number: 1, area_id: 1, is_deleted: 0 };
      TableRepository.findById.mockResolvedValue(existingTable);
      const mockArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(mockArea);
      TableRepository.existsInArea.mockResolvedValue(false);
      const mockUpdatedTable = { ...existingTable, table_number: 10 };
      TableRepository.update.mockResolvedValue(mockUpdatedTable);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Updated table');

      // Act
      const result = await TableService.updateTable(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(TableRepository.update).toHaveBeenCalledWith(1, input);
      expect(result.table_number).toBe(10);
    });

    it('TableService - UPDATE - TC-2: should throw error when new number exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - UPDATE - TC-2: Lỗi khi số bàn mới đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        table_number: 2,
        area_id: 1,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingTable = { id: 1, table_number: 1, area_id: '1', is_deleted: 0 };
      TableRepository.findById.mockResolvedValue(existingTable);
      const mockArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(mockArea);
      TableRepository.existsInArea.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Bàn số 2 đã tồn tại trong khu vực này';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(TableService.updateTable(input.id, input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(TableRepository.update).not.toHaveBeenCalled();
    });
  });

  // ========== DELETE TABLE TESTS ==========
  describe('deleteTable', () => {
    it('TableService - DELETE - TC-1: should delete table successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - DELETE - TC-1: Xóa bàn thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingTable = { id: 1, table_number: 1, area_id: 1, is_deleted: 0 };
      TableRepository.findById.mockResolvedValue(existingTable);
      TableRepository.softDelete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Table soft deleted');

      // Act
      const result = await TableService.deleteTable(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(TableRepository.findById).toHaveBeenCalledWith(1);
      expect(TableRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  // ========== GET TABLES BY AREA TESTS ==========
  describe('getTablesByArea', () => {
    it('TableService - GET_BY_AREA - TC-1: should get tables by area ID', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('TableService - GET_BY_AREA - TC-1: Lấy bàn theo khu vực');
      console.log('='.repeat(50));

      // INPUT
      const input = { areaId: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockTables = [
        { id: 1, table_number: 1, area_id: 1, status: 'available' },
        { id: 2, table_number: 2, area_id: 1, status: 'occupied' },
      ];
      TableRepository.findByAreaId.mockResolvedValue(mockTables);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of tables in area 1');

      // Act
      const result = await TableService.getTablesByArea(input.areaId);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(TableRepository.findByAreaId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.area_id === 1)).toBe(true);
    });
  });
});
