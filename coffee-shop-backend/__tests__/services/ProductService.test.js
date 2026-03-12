const ProductService = require('../../src/services/ProductService');
const ProductRepository = require('../../src/repositories/ProductRepository');
const ProductSizeRepository = require('../../src/repositories/ProductSizeRepository');
const ProductImageRepository = require('../../src/repositories/ProductImageRepository');
const CategoryRepository = require('../../src/repositories/CategoryRepository');
const cloudinary = require('../../src/config/cloudinary');
const ErrorResponse = require('../../src/utils/ErrorResponse');

// mock dependencies
jest.mock('../../src/repositories/ProductRepository');
jest.mock('../../src/repositories/ProductSizeRepository');
jest.mock('../../src/repositories/ProductImageRepository');
jest.mock('../../src/repositories/CategoryRepository');
jest.mock('../../src/config/cloudinary');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock cloudinary uploader
    cloudinary.uploader = { destroy: jest.fn().mockResolvedValue({}) };
  });

  // ============================================================
  // getAllProducts
  // ============================================================
  describe('getAllProducts', () => {
    it('TC-1: should get all products without filter', async () => {
      console.log('\n===== ProductService.getAllProducts (TC-1) =====');
      console.log('INPUT: options = {}');
      
      const mockProducts = [
        { id: 1, name: 'Cà phê đen', status: 'available' },
        { id: 2, name: 'Cà phê sữa', status: 'unavailable' }
      ];
      ProductRepository.findAllWithDetails.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT:', mockProducts);
      const result = await ProductService.getAllProducts({});
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.findAllWithDetails).toHaveBeenCalledWith({}, {});
      expect(result).toEqual(mockProducts);
    });

    it('TC-2: should get products with status filter', async () => {
      console.log('\n===== ProductService.getAllProducts (TC-2) =====');
      console.log('INPUT: options = { status: "available", page: 1, limit: 10 }');
      
      const mockProducts = [
        { id: 1, name: 'Cà phê đen', status: 'available' }
      ];
      ProductRepository.findAllWithDetails.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT:', mockProducts);
      const result = await ProductService.getAllProducts({ status: 'available', page: 1, limit: 10 });
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.findAllWithDetails).toHaveBeenCalledWith(
        { status: 'available' },
        { page: 1, limit: 10 }
      );
      expect(result).toEqual(mockProducts);
    });
  });

  // ============================================================
  // getProductById
  // ============================================================
  describe('getProductById', () => {
    it('TC-1: should return product when exists', async () => {
      console.log('\n===== ProductService.getProductById (TC-1) =====');
      console.log('INPUT: id = 1');
      
      const mockProduct = { id: 1, name: 'Cà phê đen', sizes: [], images: [] };
      ProductRepository.findByIdWithDetails.mockResolvedValue(mockProduct);

      console.log('OUTPUT EXPECT:', mockProduct);
      const result = await ProductService.getProductById(1);
      console.log('OUTPUT REALITY:', result);

      expect(result).toEqual(mockProduct);
    });

    it('TC-2: should throw 404 when product not found', async () => {
      console.log('\n===== ProductService.getProductById (TC-2) =====');
      console.log('INPUT: id = 999');
      
      ProductRepository.findByIdWithDetails.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.getProductById(999)).rejects.toThrow('Product không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });

  // ============================================================
  // getProductsByCategory
  // ============================================================
  describe('getProductsByCategory', () => {
    it('TC-1: should return products when category exists', async () => {
      console.log('\n===== ProductService.getProductsByCategory (TC-1) =====');
      console.log('INPUT: categoryId = 1, options = {}');
      
      CategoryRepository.findById.mockResolvedValue({ id: 1, name: 'Cà phê', is_deleted: 0 });
      const mockProducts = [
        { id: 1, name: 'Cà phê đen', category_id: 1 }
      ];
      ProductRepository.findByCategory.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT:', mockProducts);
      const result = await ProductService.getProductsByCategory(1, {});
      console.log('OUTPUT REALITY:', result);

      expect(result).toEqual(mockProducts);
    });

    it('TC-2: should throw 404 when category not found', async () => {
      console.log('\n===== ProductService.getProductsByCategory (TC-2) =====');
      console.log('INPUT: categoryId = 999');
      
      CategoryRepository.findById.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.getProductsByCategory(999, {})).rejects.toThrow('Category không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-3: should throw 404 when category is deleted', async () => {
      console.log('\n===== ProductService.getProductsByCategory (TC-3) =====');
      console.log('INPUT: categoryId = 1 (deleted)');
      
      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 1 });

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.getProductsByCategory(1, {})).rejects.toThrow('Category không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });

  // ============================================================
  // createProduct
  // ============================================================
  describe('createProduct', () => {
    it('TC-1: should create product successfully with images', async () => {
      console.log('\n===== ProductService.createProduct (TC-1) =====');
      const data = {
        name: 'Cà phê đen',
        category_id: 1,
        status: 'available',
        description: 'Ngon',
        images: [
          { url: 'http://image1.jpg' },
          { url: 'http://image2.jpg' }
        ]
      };
      console.log('INPUT:', data);
      
      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 0 });
      ProductRepository.findByName.mockResolvedValue(null);
      ProductRepository.create.mockResolvedValue({ id: 1 });
      ProductImageRepository.create.mockResolvedValue({});
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1, name: 'Cà phê đen' });

      console.log('OUTPUT EXPECT: { id: 1, name: "Cà phê đen" }');
      const result = await ProductService.createProduct(data);
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.create).toHaveBeenCalledWith({
        name: 'Cà phê đen',
        category_id: 1,
        status: 'available',
        description: 'Ngon'
      });
      expect(ProductImageRepository.create).toHaveBeenCalledTimes(2);
      expect(ProductImageRepository.create).toHaveBeenNthCalledWith(1, {
        product_id: 1,
        image_url: 'http://image1.jpg',
        isThumbnail: 1
      });
      expect(ProductImageRepository.create).toHaveBeenNthCalledWith(2, {
        product_id: 1,
        image_url: 'http://image2.jpg',
        isThumbnail: 0
      });
    });

    it('TC-2: should throw 404 when category not exists', async () => {
      console.log('\n===== ProductService.createProduct (TC-2) =====');
      console.log('INPUT: category_id = 999 (not exists)');
      
      CategoryRepository.findById.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.createProduct({ name: 'Test', category_id: 999 }))
        .rejects.toThrow('Category không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-3: should throw 409 when product name already exists', async () => {
      console.log('\n===== ProductService.createProduct (TC-3) =====');
      console.log('INPUT: name = "Cà phê đen" (exists)');
      
      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 0 });
      ProductRepository.findByName.mockResolvedValue({ id: 1, name: 'Cà phê đen' });

      console.log('OUTPUT EXPECT: throw ErrorResponse(409)');
      await expect(ProductService.createProduct({ name: 'Cà phê đen', category_id: 1 }))
        .rejects.toThrow('Tên product đã tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-4: should throw 400 when too many images', async () => {
      console.log('\n===== ProductService.createProduct (TC-4) =====');
      console.log('INPUT: images.length = 6 (> 5)');
      
      CategoryRepository.findById.mockResolvedValue({ id: 1, is_deleted: 0 });
      ProductRepository.findByName.mockResolvedValue(null);

      const data = {
        name: 'Test',
        category_id: 1,
        images: [1, 2, 3, 4, 5, 6].map(i => ({ url: `http://img${i}.jpg` }))
      };

      console.log('OUTPUT EXPECT: throw ErrorResponse(400)');
      await expect(ProductService.createProduct(data))
        .rejects.toThrow('Tối đa chỉ được upload 5 ảnh');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });

  // ============================================================
  // updateProduct
  // ============================================================
  describe('updateProduct', () => {
    it('TC-1: should update basic product info', async () => {
      console.log('\n===== ProductService.updateProduct (TC-1) =====');
      const data = {
        name: 'Cà phê đen mới',
        status: 'unavailable',
        description: 'Updated'
      };
      console.log('INPUT: id = 1, data =', data);
      
      ProductRepository.findById.mockResolvedValue({ id: 1, name: 'Old' });
      ProductRepository.findByName.mockResolvedValue(null);
      ProductRepository.update.mockResolvedValue(true);
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1, name: 'Cà phê đen mới' });

      console.log('OUTPUT EXPECT: updated product');
      const result = await ProductService.updateProduct(1, data);
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.update).toHaveBeenCalledWith(1, {
        name: 'Cà phê đen mới',
        status: 'unavailable',
        description: 'Updated'
      });
    });

    it('TC-2: should throw 404 when product not found', async () => {
      console.log('\n===== ProductService.updateProduct (TC-2) =====');
      console.log('INPUT: id = 999');
      
      ProductRepository.findById.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.updateProduct(999, { name: 'Test' }))
        .rejects.toThrow('Product không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-3: should throw 409 when duplicate name', async () => {
      console.log('\n===== ProductService.updateProduct (TC-3) =====');
      console.log('INPUT: name = "Cà phê sữa" (exists for another product)');
      
      ProductRepository.findById.mockResolvedValue({ id: 1, name: 'Old' });
      ProductRepository.findByName.mockResolvedValue({ id: 2, name: 'Cà phê sữa' });

      console.log('OUTPUT EXPECT: throw ErrorResponse(409)');
      await expect(ProductService.updateProduct(1, { name: 'Cà phê sữa' }))
        .rejects.toThrow('Tên product đã tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-4: should update sizes correctly', async () => {
      console.log('\n===== ProductService.updateProduct (TC-4) =====');
      const data = {
        sizes: [
          { size: 'S', price: 20000 },
          { size: 'M', price: 25000 }
        ]
      };
      console.log('INPUT: id = 1, sizes =', data.sizes);
      
      ProductRepository.findById.mockResolvedValue({ id: 1 });
      ProductRepository.update.mockResolvedValue(true);
      ProductSizeRepository.softDeleteNotIn.mockResolvedValue({});
      ProductSizeRepository.upsert.mockResolvedValue({});
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1 });

      console.log('OUTPUT EXPECT: sizes upserted');
      await ProductService.updateProduct(1, data);
      console.log('OUTPUT REALITY: success');

      expect(ProductSizeRepository.softDeleteNotIn).toHaveBeenCalledWith(1, ['S', 'M']);
      expect(ProductSizeRepository.upsert).toHaveBeenCalledWith(1, 'S', 20000);
      expect(ProductSizeRepository.upsert).toHaveBeenCalledWith(1, 'M', 25000);
    });

    it('TC-5: should handle image deletion and upload', async () => {
      console.log('\n===== ProductService.updateProduct (TC-5) =====');
      const data = {
        deleteImageIds: [5],
        newImages: [{ url: 'http://new.jpg' }]
      };
      console.log('INPUT:', data);
      
      ProductRepository.findById.mockResolvedValue({ id: 1 });
      ProductImageRepository.findById.mockResolvedValue({ 
        id: 5, 
        image_url: 'http://cloudinary.com/products/abc.jpg',
        isThumbnail: 0
      });
      ProductImageRepository.softDelete.mockResolvedValue(true);
      ProductImageRepository.findByProductId.mockResolvedValue([
        { id: 6, isThumbnail: 1 }
      ]);
      ProductImageRepository.create.mockResolvedValue({});
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1 });

      console.log('OUTPUT EXPECT: image deleted from cloudinary and new image created');
      await ProductService.updateProduct(1, data);
      console.log('OUTPUT REALITY: success');

      expect(ProductImageRepository.softDelete).toHaveBeenCalledWith(5);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/abc');
      expect(ProductImageRepository.create).toHaveBeenCalledWith({
        product_id: 1,
        image_url: 'http://new.jpg',
        isThumbnail: 0
      });
    });

    it('TC-6: should throw 400 for invalid size', async () => {
      console.log('\n===== ProductService.updateProduct (TC-6) =====');
      console.log('INPUT: sizes = [{ size: "XL", price: 30000 }]');
      
      ProductRepository.findById.mockResolvedValue({ id: 1 });

      console.log('OUTPUT EXPECT: throw ErrorResponse(400)');
      await expect(ProductService.updateProduct(1, { sizes: [{ size: 'XL', price: 30000 }] }))
        .rejects.toThrow('Size "XL" không hợp lệ');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-7: should throw 400 for duplicate sizes', async () => {
      console.log('\n===== ProductService.updateProduct (TC-7) =====');
      console.log('INPUT: sizes with duplicates [S, M, S]');
      
      ProductRepository.findById.mockResolvedValue({ id: 1 });

      console.log('OUTPUT EXPECT: throw ErrorResponse(400)');
      await expect(ProductService.updateProduct(1, { 
        sizes: [
          { size: 'S', price: 20000 },
          { size: 'M', price: 25000 },
          { size: 'S', price: 22000 }
        ] 
      })).rejects.toThrow('Không được có size trùng lặp');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });

  // ============================================================
  // deleteProduct
  // ============================================================
  describe('deleteProduct', () => {
    it('TC-1: should delete product successfully', async () => {
      console.log('\n===== ProductService.deleteProduct (TC-1) =====');
      console.log('INPUT: id = 1');
      
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1 });
      ProductRepository.softDelete.mockResolvedValue(true);

      console.log('OUTPUT EXPECT: true');
      const result = await ProductService.deleteProduct(1);
      console.log('OUTPUT REALITY:', result);

      expect(result).toBe(true);
    });

    it('TC-2: should throw 404 when product not found', async () => {
      console.log('\n===== ProductService.deleteProduct (TC-2) =====');
      console.log('INPUT: id = 999');
      
      ProductRepository.findByIdWithDetails.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.deleteProduct(999)).rejects.toThrow('Product không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });

  // ============================================================
  // searchProducts
  // ============================================================
  describe('searchProducts', () => {
    it('TC-1: should search products by keyword', async () => {
      console.log('\n===== ProductService.searchProducts (TC-1) =====');
      console.log('INPUT: keyword = "cà phê"');
      
      const mockProducts = [{ id: 1, name: 'Cà phê đen' }];
      ProductRepository.search.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT:', mockProducts);
      const result = await ProductService.searchProducts('cà phê', {});
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.search).toHaveBeenCalledWith('cà phê', {});
      expect(result).toEqual(mockProducts);
    });

    it('TC-2: should return all products when keyword is empty', async () => {
      console.log('\n===== ProductService.searchProducts (TC-2) =====');
      console.log('INPUT: keyword = ""');
      
      const mockProducts = [{ id: 1 }, { id: 2 }];
      ProductRepository.findAllWithDetails.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT: call getAllProducts');
      const result = await ProductService.searchProducts('', {});
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.findAllWithDetails).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('TC-3: should return all products when keyword is only whitespace', async () => {
      console.log('\n===== ProductService.searchProducts (TC-3) =====');
      console.log('INPUT: keyword = "   "');
      
      const mockProducts = [{ id: 1 }, { id: 2 }];
      ProductRepository.findAllWithDetails.mockResolvedValue(mockProducts);

      console.log('OUTPUT EXPECT: call getAllProducts');
      const result = await ProductService.searchProducts('   ', {});
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.findAllWithDetails).toHaveBeenCalled();
    });
  });

  // ============================================================
  // restoreProduct
  // ============================================================
  describe('restoreProduct', () => {
    it('TC-1: should restore deleted product', async () => {
      console.log('\n===== ProductService.restoreProduct (TC-1) =====');
      console.log('INPUT: id = 1');
      
      ProductRepository.findById.mockResolvedValue({ id: 1, status: 'unavailable' });
      ProductRepository.update.mockResolvedValue(true);
      ProductRepository.findByIdWithDetails.mockResolvedValue({ id: 1, status: 'available' });

      console.log('OUTPUT EXPECT: restored product with status = available');
      const result = await ProductService.restoreProduct(1);
      console.log('OUTPUT REALITY:', result);

      expect(ProductRepository.update).toHaveBeenCalledWith(1, { status: 'available' });
      expect(result).toEqual({ id: 1, status: 'available' });
    });

    it('TC-2: should throw 404 when product not found', async () => {
      console.log('\n===== ProductService.restoreProduct (TC-2) =====');
      console.log('INPUT: id = 999');
      
      ProductRepository.findById.mockResolvedValue(null);

      console.log('OUTPUT EXPECT: throw ErrorResponse(404)');
      await expect(ProductService.restoreProduct(999)).rejects.toThrow('Product không tồn tại');
      console.log('OUTPUT REALITY: threw error as expected');
    });

    it('TC-3: should throw 400 when product is not deleted', async () => {
      console.log('\n===== ProductService.restoreProduct (TC-3) =====');
      console.log('INPUT: id = 1 (status = available)');
      
      ProductRepository.findById.mockResolvedValue({ id: 1, status: 'available' });

      console.log('OUTPUT EXPECT: throw ErrorResponse(400)');
      await expect(ProductService.restoreProduct(1)).rejects.toThrow('Product chưa bị xóa');
      console.log('OUTPUT REALITY: threw error as expected');
    });
  });
});
