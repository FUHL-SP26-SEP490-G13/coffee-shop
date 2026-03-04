const ProductService = require('../../src/services/ProductService');
const ProductRepository = require('../../src/repositories/ProductRepository');
const ProductSizeRepository = require('../../src/repositories/ProductSizeRepository');
const ProductImageRepository = require('../../src/repositories/ProductImageRepository');
const CategoryRepository = require('../../src/repositories/CategoryRepository');
const { extractPublicId } = require('../../src/utils/cloudinaryHelper');
const cloudinary = require('../../src/config/cloudinary');

// mock dependencies
jest.mock('../../src/repositories/ProductRepository');
jest.mock('../../src/repositories/ProductSizeRepository');
jest.mock('../../src/repositories/ProductImageRepository');
jest.mock('../../src/repositories/CategoryRepository');
jest.mock('../../src/utils/cloudinaryHelper');
jest.mock('../../src/config/cloudinary');

describe('ProductService.updateProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-1: should soft-delete provided size and image ids and upsert new ones', async () => {
    // arrange
    ProductRepository.findById.mockResolvedValue({ id: 1 });
    CategoryRepository.findById.mockResolvedValue({ id: 2 });
    ProductRepository.update.mockResolvedValue(true);
    ProductSizeRepository.softDelete.mockResolvedValue(true);
    ProductSizeRepository.softDeleteNotIn.mockResolvedValue({});
    ProductSizeRepository.upsert.mockResolvedValue({});
    ProductImageRepository.findById.mockResolvedValue({ id: 5, image_url: 'http://foo/bar.jpg' });
    // repository now exposes softDeleteById wrapper
    ProductImageRepository.softDeleteById = jest.fn().mockResolvedValue(true);
    ProductImageRepository.create.mockResolvedValue({});
    ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1 });

    extractPublicId.mockReturnValue('products/foo');
    cloudinary.uploader.destroy = jest.fn().mockResolvedValue({});

    const payload = {
      deleteSizeIds: [10],
      sizes: [{ size: 'L', price: 123 }],
      deleteImageIds: [5],
      newImages: [{ url: 'http://new' }],
    };

    // act
    const result = await ProductService.updateProduct(1, payload);

    // assert
    expect(ProductSizeRepository.softDelete).toHaveBeenCalledWith(10);
    expect(ProductSizeRepository.softDeleteNotIn).toHaveBeenCalledWith(1, ['L']);
    expect(ProductSizeRepository.upsert).toHaveBeenCalledWith(1, 'L', 123);
    expect(ProductImageRepository.softDeleteById).toHaveBeenCalledWith(5);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/foo');
    expect(ProductImageRepository.create).toHaveBeenCalledWith({
      product_id: 1,
      image_url: 'http://new',
      isThumbnail: 0,
    });
    expect(result).toEqual({ id: 1 });
  });
});
