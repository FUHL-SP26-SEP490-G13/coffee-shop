const CategoryService = require('../../src/services/CategoryService');
const CategoryRepository = require('../../src/repositories/CategoryRepository');
const ErrorResponse = require('../../src/utils/ErrorResponse');
const slugify = require('slugify');

jest.mock('../../src/repositories/CategoryRepository');
jest.mock('slugify', () => jest.fn());

const logCase = ({ method, tcid, crud, input, outputExpect }) => {
  console.log('\n' + '='.repeat(70));
  console.log(`CategoryService - ${method} - ${tcid}`);
  console.log('CRUD TYPE:', crud);
  console.log('INPUT:', JSON.stringify(input, null, 2));
  console.log('OUTPUT EXPECT:', outputExpect);
  console.log('='.repeat(70));
};

const logReality = (output) => {
  console.log('OUTPUT REALITY:', JSON.stringify(output, null, 2));
};

const expectServiceError = async (runner, expected) => {
  let actualError;

  try {
    await runner();
  } catch (error) {
    actualError = error;
  }

  logReality({
    statusCode: actualError?.statusCode,
    message: actualError?.message,
  });

  expect(actualError).toBeInstanceOf(ErrorResponse);
  expect(actualError.statusCode).toBe(expected.statusCode);
  expect(actualError.message).toBe(expected.message);
};

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    slugify.mockReturnValue('default-slug');
  });

  describe('getAllCategories', () => {
    it('CategoryService - getAllCategories - TC-01: lấy danh mục active với options mặc định', async () => {
      const input = {};
      const mockCategories = [
        { id: 1, name: 'Cà phê', is_deleted: 0 },
        { id: 2, name: 'Trà sữa', is_deleted: 0 },
      ];

      logCase({
        method: 'getAllCategories',
        tcid: 'TC-01',
        crud: 'READ',
        input,
        outputExpect: 'Trả về danh sách category active',
      });

      CategoryRepository.findAllActive.mockResolvedValue(mockCategories);

      const result = await CategoryService.getAllCategories();
      logReality(result);

      expect(CategoryRepository.findAllActive).toHaveBeenCalledWith({});
      expect(result).toEqual(mockCategories);
    });

    it('CategoryService - getAllCategories - TC-02: lấy danh mục active với options truyền vào', async () => {
      const input = { limit: 10, offset: 20 };

      logCase({
        method: 'getAllCategories',
        tcid: 'TC-02',
        crud: 'READ',
        input,
        outputExpect: 'Gọi repository với đúng options',
      });

      CategoryRepository.findAllActive.mockResolvedValue([]);

      const result = await CategoryService.getAllCategories(input);
      logReality(result);

      expect(CategoryRepository.findAllActive).toHaveBeenCalledWith(input);
      expect(result).toEqual([]);
    });
  });

  describe('getCategoryById', () => {
    it('CategoryService - getCategoryById - TC-01: lấy category theo id thành công', async () => {
      const input = { id: 1 };
      const mockCategory = { id: 1, name: 'Cà phê', is_deleted: 0 };

      logCase({
        method: 'getCategoryById',
        tcid: 'TC-01',
        crud: 'READ',
        input,
        outputExpect: 'Trả về category khi tồn tại và chưa bị xóa',
      });

      CategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await CategoryService.getCategoryById(input.id);
      logReality(result);

      expect(CategoryRepository.findById).toHaveBeenCalledWith(input.id);
      expect(result).toEqual(mockCategory);
    });

    it('CategoryService - getCategoryById - TC-02: trả lỗi khi category không tồn tại', async () => {
      const input = { id: 999 };

      logCase({
        method: 'getCategoryById',
        tcid: 'TC-02',
        crud: 'READ',
        input,
        outputExpect: 'Ném lỗi 404: Category không tồn tại',
      });

      CategoryRepository.findById.mockResolvedValue(null);

      await expectServiceError(
        () => CategoryService.getCategoryById(input.id),
        { statusCode: 404, message: 'Category không tồn tại' },
      );
    });

    it('CategoryService - getCategoryById - TC-03: trả lỗi khi category đã bị xóa mềm', async () => {
      const input = { id: 5 };

      logCase({
        method: 'getCategoryById',
        tcid: 'TC-03',
        crud: 'READ',
        input,
        outputExpect: 'Ném lỗi 404: Category đã bị xóa',
      });

      CategoryRepository.findById.mockResolvedValue({
        id: 5,
        name: 'Đã xóa',
        is_deleted: 1,
      });

      await expectServiceError(
        () => CategoryService.getCategoryById(input.id),
        { statusCode: 404, message: 'Category đã bị xóa' },
      );
    });
  });

  describe('createCategory', () => {
    it('CategoryService - createCategory - TC-01: tạo category thành công', async () => {
      const input = {
        name: '  Cà phê đá  ',
        code: ' cf01 ',
        image_url: 'coffee.jpg',
      };

      logCase({
        method: 'createCategory',
        tcid: 'TC-01',
        crud: 'CREATE',
        input,
        outputExpect: 'Tạo category mới với name trim, code upper, slug duy nhất',
      });

      slugify.mockReturnValue('ca-phe-da');
      CategoryRepository.findByName.mockResolvedValue(null);
      CategoryRepository.findByCode.mockResolvedValue(null);
      CategoryRepository.findBySlug.mockResolvedValue(null);

      const created = {
        id: 10,
        name: 'Cà phê đá',
        code: 'CF01',
        image_url: 'coffee.jpg',
        slug: 'ca-phe-da',
      };
      CategoryRepository.create.mockResolvedValue(created);

      const result = await CategoryService.createCategory(input);
      logReality(result);

      expect(CategoryRepository.findByName).toHaveBeenCalledWith(input.name);
      expect(CategoryRepository.findByCode).toHaveBeenCalledWith(input.code);
      expect(slugify).toHaveBeenCalled();
      expect(CategoryRepository.create).toHaveBeenCalledWith({
        name: 'Cà phê đá',
        code: 'CF01',
        image_url: 'coffee.jpg',
        slug: 'ca-phe-da',
      });
      expect(result).toEqual(created);
    });

    it('CategoryService - createCategory - TC-02: trả lỗi khi tên category đã tồn tại', async () => {
      const input = { name: 'Cà phê', code: 'CF01' };

      logCase({
        method: 'createCategory',
        tcid: 'TC-02',
        crud: 'CREATE',
        input,
        outputExpect: 'Ném lỗi 409: Tên category đã tồn tại',
      });

      CategoryRepository.findByName.mockResolvedValue({ id: 1, name: 'Cà phê' });

      await expectServiceError(
        () => CategoryService.createCategory(input),
        { statusCode: 409, message: 'Tên category đã tồn tại' },
      );

      expect(CategoryRepository.findByCode).not.toHaveBeenCalled();
      expect(CategoryRepository.create).not.toHaveBeenCalled();
    });

    it('CategoryService - createCategory - TC-03: trả lỗi khi code category đã tồn tại', async () => {
      const input = { name: 'Trà đào', code: 'TD01' };

      logCase({
        method: 'createCategory',
        tcid: 'TC-03',
        crud: 'CREATE',
        input,
        outputExpect: 'Ném lỗi 409: Mã code category đã tồn tại',
      });

      CategoryRepository.findByName.mockResolvedValue(null);
      CategoryRepository.findByCode.mockResolvedValue({ id: 2, code: 'TD01' });

      await expectServiceError(
        () => CategoryService.createCategory(input),
        { statusCode: 409, message: 'Mã code category đã tồn tại' },
      );

      expect(CategoryRepository.findBySlug).not.toHaveBeenCalled();
      expect(CategoryRepository.create).not.toHaveBeenCalled();
    });

    it('CategoryService - createCategory - TC-04: tự tăng hậu tố slug khi bị trùng', async () => {
      const input = { name: 'Trà sữa', code: 'TS01' };

      logCase({
        method: 'createCategory',
        tcid: 'TC-04',
        crud: 'CREATE',
        input,
        outputExpect: 'Slug bị trùng sẽ thành tra-sua-1',
      });

      slugify.mockReturnValue('tra-sua');
      CategoryRepository.findByName.mockResolvedValue(null);
      CategoryRepository.findByCode.mockResolvedValue(null);
      CategoryRepository.findBySlug
        .mockResolvedValueOnce({ id: 1, slug: 'tra-sua' })
        .mockResolvedValueOnce(null);
      CategoryRepository.create.mockResolvedValue({ id: 20, slug: 'tra-sua-1' });

      const result = await CategoryService.createCategory(input);
      logReality(result);

      expect(CategoryRepository.findBySlug).toHaveBeenNthCalledWith(1, 'tra-sua');
      expect(CategoryRepository.findBySlug).toHaveBeenNthCalledWith(2, 'tra-sua-1');
      expect(CategoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'tra-sua-1' }),
      );
    });
  });

  describe('updateCategory', () => {
    it('CategoryService - updateCategory - TC-01: cập nhật name/code/image thành công', async () => {
      const input = {
        id: 1,
        data: {
          name: '  Trà đào cam sả  ',
          code: ' td02 ',
          image_url: 'new-image.jpg',
        },
      };

      logCase({
        method: 'updateCategory',
        tcid: 'TC-01',
        crud: 'UPDATE',
        input,
        outputExpect: 'Cập nhật dữ liệu và tạo slug mới duy nhất',
      });

      CategoryRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Cà phê',
        code: 'CF01',
        is_deleted: 0,
      });
      slugify.mockReturnValue('tra-dao-cam-sa');
      CategoryRepository.findByName.mockResolvedValue(null);
      CategoryRepository.findBySlug
        .mockResolvedValueOnce({ id: 2, slug: 'tra-dao-cam-sa' })
        .mockResolvedValueOnce(null);
      CategoryRepository.findByCode.mockResolvedValue(null);
      CategoryRepository.update.mockResolvedValue({ id: 1, name: 'Trà đào cam sả' });

      const result = await CategoryService.updateCategory(input.id, input.data);
      logReality(result);

      expect(CategoryRepository.update).toHaveBeenCalledWith(1, {
        name: 'Trà đào cam sả',
        slug: 'tra-dao-cam-sa-1',
        code: 'TD02',
        image_url: 'new-image.jpg',
      });
    });

    it('CategoryService - updateCategory - TC-02: trả lỗi khi tên mới đã tồn tại ở category khác', async () => {
      const input = { id: 1, data: { name: 'Trà sữa' } };

      logCase({
        method: 'updateCategory',
        tcid: 'TC-02',
        crud: 'UPDATE',
        input,
        outputExpect: 'Ném lỗi 409: Tên danh mục đã tồn tại',
      });

      CategoryRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Cà phê',
        code: 'CF01',
        is_deleted: 0,
      });
      CategoryRepository.findByName.mockResolvedValue({ id: 2, name: 'Trà sữa' });

      await expectServiceError(
        () => CategoryService.updateCategory(input.id, input.data),
        { statusCode: 409, message: 'Tên danh mục đã tồn tại' },
      );

      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });

    it('CategoryService - updateCategory - TC-03: trả lỗi khi code mới đã tồn tại ở category khác', async () => {
      const input = { id: 1, data: { code: 'TS01' } };

      logCase({
        method: 'updateCategory',
        tcid: 'TC-03',
        crud: 'UPDATE',
        input,
        outputExpect: 'Ném lỗi 409: Mã Code danh mục đã tồn tại',
      });

      CategoryRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Cà phê',
        code: 'CF01',
        is_deleted: 0,
      });
      CategoryRepository.findByCode.mockResolvedValue({ id: 2, code: 'TS01' });

      await expectServiceError(
        () => CategoryService.updateCategory(input.id, input.data),
        { statusCode: 409, message: 'Mã Code danh mục đã tồn tại' },
      );

      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });

    it('CategoryService - updateCategory - TC-04: chỉ cập nhật image_url khi name/code không đổi', async () => {
      const input = {
        id: 7,
        data: { name: 'Cà phê', code: 'CF01', image_url: 'new.jpg' },
      };

      logCase({
        method: 'updateCategory',
        tcid: 'TC-04',
        crud: 'UPDATE',
        input,
        outputExpect: 'Không check trùng name/code nếu không đổi giá trị',
      });

      CategoryRepository.findById.mockResolvedValue({
        id: 7,
        name: 'Cà phê',
        code: 'CF01',
        is_deleted: 0,
      });
      CategoryRepository.update.mockResolvedValue({ id: 7, image_url: 'new.jpg' });

      const result = await CategoryService.updateCategory(input.id, input.data);
      logReality(result);

      expect(CategoryRepository.findByName).not.toHaveBeenCalled();
      expect(CategoryRepository.findByCode).not.toHaveBeenCalled();
      expect(CategoryRepository.findBySlug).not.toHaveBeenCalled();
      expect(CategoryRepository.update).toHaveBeenCalledWith(7, { image_url: 'new.jpg' });
    });
  });

  describe('deleteCategory', () => {
    it('CategoryService - deleteCategory - TC-01: xóa mềm category thành công', async () => {
      const input = { id: 1 };

      logCase({
        method: 'deleteCategory',
        tcid: 'TC-01',
        crud: 'DELETE',
        input,
        outputExpect: 'Trả về true khi xóa mềm thành công',
      });

      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 0 });
      CategoryRepository.hasProducts.mockResolvedValue(false);
      CategoryRepository.softDelete.mockResolvedValue(true);

      const result = await CategoryService.deleteCategory(input.id);
      logReality({ result });

      expect(CategoryRepository.hasProducts).toHaveBeenCalledWith(1);
      expect(CategoryRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('CategoryService - deleteCategory - TC-02: trả lỗi khi category đang có sản phẩm sử dụng', async () => {
      const input = { id: 1 };

      logCase({
        method: 'deleteCategory',
        tcid: 'TC-02',
        crud: 'DELETE',
        input,
        outputExpect: 'Ném lỗi 400: Không thể xóa danh mục vì có sản phẩm đang sử dụng',
      });

      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 0 });
      CategoryRepository.hasProducts.mockResolvedValue(true);

      await expectServiceError(
        () => CategoryService.deleteCategory(input.id),
        {
          statusCode: 400,
          message: 'Không thể xóa danh mục vì có sản phẩm đang sử dụng',
        },
      );

      expect(CategoryRepository.softDelete).not.toHaveBeenCalled();
    });

    it('CategoryService - deleteCategory - TC-03: trả lỗi khi soft delete thất bại', async () => {
      const input = { id: 3 };

      logCase({
        method: 'deleteCategory',
        tcid: 'TC-03',
        crud: 'DELETE',
        input,
        outputExpect: 'Ném lỗi 500: Xóa danh mục thất bại',
      });

      CategoryRepository.findById.mockResolvedValue({ id: 3, is_deleted: 0 });
      CategoryRepository.hasProducts.mockResolvedValue(false);
      CategoryRepository.softDelete.mockResolvedValue(false);

      await expectServiceError(
        () => CategoryService.deleteCategory(input.id),
        { statusCode: 500, message: 'Xóa danh mục thất bại' },
      );
    });

    it('CategoryService - deleteCategory - TC-04: trả lỗi khi category không tồn tại', async () => {
      const input = { id: 404 };

      logCase({
        method: 'deleteCategory',
        tcid: 'TC-04',
        crud: 'DELETE',
        input,
        outputExpect: 'Ném lỗi 404: Category không tồn tại',
      });

      CategoryRepository.findById.mockResolvedValue(null);

      await expectServiceError(
        () => CategoryService.deleteCategory(input.id),
        { statusCode: 404, message: 'Category không tồn tại' },
      );

      expect(CategoryRepository.hasProducts).not.toHaveBeenCalled();
      expect(CategoryRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
