const AreaService = require('../../src/services/AreaService');
const AreaRepository = require('../../src/repositories/AreaRepository');

// Mock dependencies
jest.mock('../../src/repositories/AreaRepository');

describe('AreaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET ALL AREAS TESTS ==========
  describe('getAllAreas', () => {
    it('AreaService - getAllAreas - TC-01: should get all areas ordered by name', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - GET_ALL - TC-1: Lấy tất cả khu vực');
      console.log('='.repeat(50));

      // Arrange
      const mockAreas = [
        { id: 1, name: 'Khu A', image: 'image1.jpg' },
        { id: 2, name: 'Khu B', image: 'image2.jpg' },
      ];
      AreaRepository.findAll.mockResolvedValue(mockAreas);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of areas ordered by name ASC');

      // Act
      const result = await AreaService.getAllAreas();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.findAll).toHaveBeenCalledWith({}, { orderBy: 'name', order: 'ASC' });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Khu A');
    });
  });

  // ========== GET AREA BY ID TESTS ==========
  describe('getAreaById', () => {
    it('AreaService - getAreaById - TC-01: should get area by ID successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - GET_BY_ID - TC-1: Lấy khu vực theo ID thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockArea = { id: 1, name: 'Khu A', image: 'image1.jpg' };
      AreaRepository.findById.mockResolvedValue(mockArea);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Area object with id = 1');

      // Act
      const result = await AreaService.getAreaById(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Khu A');
    });

    it('AreaService - getAreaById - TC-02: should throw error when area not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - GET_BY_ID - TC-2: Lỗi khi khu vực không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AreaRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Khu vực không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AreaService.getAreaById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(AreaRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  // ========== CREATE AREA TESTS ==========
  describe('createArea', () => {
    it('AreaService - createArea - TC-01: should create area successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - CREATE - TC-1: Tạo khu vực thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        name: 'Khu C',
        image: 'image3.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AreaRepository.findOne.mockResolvedValue(null);
      const mockCreatedArea = { id: 3, ...input };
      AreaRepository.create.mockResolvedValue(mockCreatedArea);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created area with id = 3');

      // Act
      const result = await AreaService.createArea(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.findOne).toHaveBeenCalledWith({ name: input.name });
      expect(AreaRepository.create).toHaveBeenCalledWith({
        name: input.name,
        image: input.image,
      });
      expect(result.id).toBe(3);
      expect(result.name).toBe('Khu C');
    });

    it('AreaService - createArea - TC-02: should create area without image', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - CREATE - TC-2: Tạo khu vực không có ảnh');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        name: 'Khu D',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AreaRepository.findOne.mockResolvedValue(null);
      const mockCreatedArea = { id: 4, name: input.name };
      AreaRepository.create.mockResolvedValue(mockCreatedArea);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created area without image');

      // Act
      const result = await AreaService.createArea(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.create).toHaveBeenCalledWith({ name: input.name });
      expect(result.name).toBe('Khu D');
    });

    it('AreaService - createArea - TC-03: should throw error when area name exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - CREATE - TC-3: Lỗi khi tên khu vực đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        name: 'Khu A',
        image: 'image.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingArea = { id: 1, name: 'Khu A' };
      AreaRepository.findOne.mockResolvedValue(existingArea);

      // OUTPUT EXPECT
      const expectedError = 'Tên khu vực đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AreaService.createArea(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(AreaRepository.findOne).toHaveBeenCalledWith({ name: input.name });
      expect(AreaRepository.create).not.toHaveBeenCalled();
    });
  });

  // ========== UPDATE AREA TESTS ==========
  describe('updateArea', () => {
    it('AreaService - updateArea - TC-01: should update area successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - UPDATE - TC-1: Cập nhật khu vực thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        name: 'Khu A Updated',
        image: 'updated.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingArea = { id: 1, name: 'Khu A', image: 'old.jpg' };
      AreaRepository.findById.mockResolvedValue(existingArea);
      AreaRepository.findOne.mockResolvedValue(null);
      const mockUpdatedArea = { ...existingArea, ...input };
      AreaRepository.update.mockResolvedValue(mockUpdatedArea);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Updated area');

      // Act
      const result = await AreaService.updateArea(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.findById).toHaveBeenCalledWith(1);
      expect(AreaRepository.update).toHaveBeenCalledWith(1, {
        name: input.name,
        image: input.image,
      });
      expect(result.name).toBe('Khu A Updated');
    });

    it('AreaService - updateArea - TC-02: should throw error when new name exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - UPDATE - TC-2: Lỗi khi tên mới đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        name: 'Khu B',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(existingArea);
      const anotherArea = { id: 2, name: 'Khu B' };
      AreaRepository.findOne.mockResolvedValue(anotherArea);

      // OUTPUT EXPECT
      const expectedError = 'Tên khu vực đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AreaService.updateArea(input.id, input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(AreaRepository.update).not.toHaveBeenCalled();
    });
  });

  // ========== DELETE AREA TESTS ==========
  describe('deleteArea', () => {
    it('AreaService - deleteArea - TC-01: should delete area successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - DELETE - TC-1: Xóa khu vực thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingArea = { id: 1, name: 'Khu A' };
      AreaRepository.findById.mockResolvedValue(existingArea);
      AreaRepository.hardDelete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Area deleted successfully');

      // Act
      const result = await AreaService.deleteArea(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(AreaRepository.findById).toHaveBeenCalledWith(1);
      expect(AreaRepository.hardDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('AreaService - deleteArea - TC-02: should throw error when area not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - DELETE - TC-2: Lỗi khi khu vực không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AreaRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Khu vực không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AreaService.deleteArea(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(AreaRepository.hardDelete).not.toHaveBeenCalled();
    });
  });

  // ========== SEARCH AREAS TESTS ==========
  describe('searchAreas', () => {
    it('AreaService - searchAreas - TC-01: should search areas by keyword', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AreaService - SEARCH - TC-1: Tìm kiếm khu vực theo từ khóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { keyword: 'Khu A', limit: 10, offset: 0 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResults = [
        { id: 1, name: 'Khu A', image: 'image1.jpg' },
      ];
      AreaRepository.db = {
        query: jest.fn().mockResolvedValue([mockResults]),
      };

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of matching areas');

      // Act
      const result = await AreaService.searchAreas(input.keyword, { limit: input.limit, offset: input.offset });

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AreaRepository.db.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
