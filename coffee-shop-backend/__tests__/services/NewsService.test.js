const NewsService = require('../../src/services/NewsService');
const NewsRepository = require('../../src/repositories/NewsRepository');

// Mock dependencies
jest.mock('../../src/repositories/NewsRepository');
jest.mock('slugify', () => jest.fn((text) => text.toLowerCase().replace(/\s+/g, '-')));

describe('NewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GENERATE UNIQUE SLUG TESTS ==========
  describe('generateUniqueSlug', () => {
    it('NewsService - GENERATE_SLUG - TC-1: should generate unique slug', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GENERATE_SLUG - TC-1: Tạo slug unique');
      console.log('='.repeat(50));

      // INPUT
      const input = { title: 'Khuyến mãi cuối tuần' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug.mockResolvedValue(null);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Slug = "khuyến-mãi-cuối-tuần"');

      // Act
      const result = await NewsService.generateUniqueSlug(input.title);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Slug =', result);

      // Assert
      expect(result).toBe('khuyến-mãi-cuối-tuần');
    });

    it('NewsService - GENERATE_SLUG - TC-2: should append number if slug exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GENERATE_SLUG - TC-2: Thêm số nếu slug đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { title: 'News Title' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug
        .mockResolvedValueOnce({ id: 1, slug: 'news-title' })
        .mockResolvedValueOnce(null);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Slug = "news-title-1"');

      // Act
      const result = await NewsService.generateUniqueSlug(input.title);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Slug =', result);

      // Assert
      expect(result).toBe('news-title-1');
    });
  });

  // ========== GET ALL PUBLISHED TESTS ==========
  describe('getAllPublished', () => {
    it('NewsService - GET_PUBLISHED - TC-1: should get published news with pagination', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_PUBLISHED - TC-1: Lấy tin đã publish với phân trang');
      console.log('='.repeat(50));

      // INPUT
      const input = { page: 1, limit: 6 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = [
        { id: 1, title: 'News 1', slug: 'news-1' },
        { id: 2, title: 'News 2', slug: 'news-2' },
      ];
      NewsRepository.findPublishedPaginated.mockResolvedValue(mockNews);
      NewsRepository.countAll.mockResolvedValue(10);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Paginated news list');

      // Act
      const result = await NewsService.getAllPublished(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findPublishedPaginated).toHaveBeenCalledWith(6, 0);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });
  });

  // ========== GET DETAIL BY SLUG TESTS ==========
  describe('getDetailBySlug', () => {
    it('NewsService - GET_BY_SLUG - TC-1: should get news detail and increase view', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_BY_SLUG - TC-1: Lấy chi tiết tin và tăng lượt xem');
      console.log('='.repeat(50));

      // INPUT
      const input = { slug: 'news-slug' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = { id: 1, title: 'News Title', slug: 'news-slug', views: 10 };
      NewsRepository.findBySlug.mockResolvedValue(mockNews);
      NewsRepository.increaseView.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: News detail, view count increased');

      // Act
      const result = await NewsService.getDetailBySlug(input.slug);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findBySlug).toHaveBeenCalledWith('news-slug');
      expect(NewsRepository.increaseView).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('NewsService - GET_BY_SLUG - TC-2: should throw error when news not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_BY_SLUG - TC-2: Lỗi khi tin không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { slug: 'non-existent' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Tin không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(NewsService.getDetailBySlug(input.slug)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(NewsRepository.increaseView).not.toHaveBeenCalled();
    });
  });

  // ========== GET FEATURED TESTS ==========
  describe('getFeatured', () => {
    it('NewsService - GET_FEATURED - TC-1: should get featured news', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_FEATURED - TC-1: Lấy tin nổi bật');
      console.log('='.repeat(50));

      // INPUT
      const input = { limit: 3 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockFeatured = [
        { id: 1, title: 'Featured 1', is_featured: 1 },
        { id: 2, title: 'Featured 2', is_featured: 1 },
      ];
      NewsRepository.findFeatured.mockResolvedValue(mockFeatured);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of featured news (max 3)');

      // Act
      const result = await NewsService.getFeatured(input.limit);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findFeatured).toHaveBeenCalledWith(3);
      expect(result).toHaveLength(2);
    });
  });

  // ========== CREATE NEWS TESTS ==========
  describe('createNews', () => {
    it('NewsService - CREATE - TC-1: should create news successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - CREATE - TC-1: Tạo tin tức thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        title: 'New Article',
        summary: 'Summary',
        content: 'Content',
        tag: 'promotion',
        thumbnail: 'image.jpg',
      };
      const userId = 1;
      console.log('\n📝 INPUT:', JSON.stringify({ ...input, userId }, null, 2));

      // Arrange
      NewsRepository.findBySlug.mockResolvedValue(null);
      const mockCreatedNews = { id: 1, ...input, slug: 'new-article', created_by: userId };
      NewsRepository.create.mockResolvedValue(mockCreatedNews);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created news with generated slug');

      // Act
      const result = await NewsService.createNews(input, userId);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.create).toHaveBeenCalledWith({
        ...input,
        slug: 'new-article',
        created_by: userId,
      });
      expect(result.id).toBe(1);
    });
  });

  // ========== GET ALL ADMIN TESTS ==========
  describe('getAllAdmin', () => {
    it('NewsService - GET_ALL_ADMIN - TC-1: should get all news for admin', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_ALL_ADMIN - TC-1: Lấy tất cả tin cho admin');
      console.log('='.repeat(50));

      // INPUT
      const input = { page: 1, limit: 10, keyword: '' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = [
        { id: 1, title: 'News 1' },
        { id: 2, title: 'News 2' },
      ];
      NewsRepository.findAllAdminPaginated.mockResolvedValue(mockNews);
      NewsRepository.countAll.mockResolvedValue(15);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Paginated admin news list');

      // Act
      const result = await NewsService.getAllAdmin(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findAllAdminPaginated).toHaveBeenCalledWith(10, 0, '');
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(2);
    });

    it('NewsService - GET_ALL_ADMIN - TC-2: should search news with keyword', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_ALL_ADMIN - TC-2: Tìm kiếm tin với từ khóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { page: 1, limit: 10, keyword: 'khuyến mãi' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResults = [
        { id: 1, title: 'Khuyến mãi mùa hè' },
      ];
      NewsRepository.findAllAdminPaginated.mockResolvedValue(mockResults);
      NewsRepository.countAll.mockResolvedValue(1);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Filtered news by keyword');

      // Act
      const result = await NewsService.getAllAdmin(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findAllAdminPaginated).toHaveBeenCalledWith(10, 0, 'khuyến mãi');
      expect(result.items).toHaveLength(1);
    });
  });

  // ========== DELETE NEWS TESTS ==========
  describe('deleteNews', () => {
    it('NewsService - DELETE - TC-1: should delete news successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - DELETE - TC-1: Xóa tin tức thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.deleteById.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: News deleted');

      // Act
      const result = await NewsService.deleteNews(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(NewsRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  // ========== UPDATE NEWS TESTS ==========
  describe('updateNews', () => {
    it('NewsService - UPDATE - TC-1: should update news successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - UPDATE - TC-1: Cập nhật tin tức thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        id: 1,
        title: 'Updated Title',
        summary: 'Updated Summary',
        content: 'Updated Content',
        tag: 'news',
        thumbnail: 'new-image.jpg',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.updateById.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: News updated successfully');

      // Act
      const result = await NewsService.updateNews(input.id, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Updated =', result);

      // Assert
      expect(NewsRepository.updateById).toHaveBeenCalledWith(1, {
        title: input.title,
        summary: input.summary,
        content: input.content,
        tag: input.tag,
        thumbnail: input.thumbnail,
      });
      expect(result).toBe(true);
    });
  });

  // ========== GET BY ID TESTS ==========
  describe('getById', () => {
    it('NewsService - GET_BY_ID - TC-1: should get news by ID', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_BY_ID - TC-1: Lấy tin theo ID');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = { id: 1, title: 'News Title' };
      NewsRepository.findOne.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: News object with id = 1');

      // Act
      const result = await NewsService.getById(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result.id).toBe(1);
    });

    it('NewsService - GET_BY_ID - TC-2: should throw error when not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_BY_ID - TC-2: Lỗi khi không tìm thấy');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findOne.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Không tìm thấy bài viết';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(NewsService.getById(input.id)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);
    });
  });

  // ========== GET RELATED TESTS ==========
  describe('getRelated', () => {
    it('NewsService - GET_RELATED - TC-1: should get related news by tag', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_RELATED - TC-1: Lấy tin liên quan theo tag');
      console.log('='.repeat(50));

      // INPUT
      const input = { tag: 'promotion', excludeId: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockRelated = [
        { id: 2, title: 'Related 1', tag: 'promotion' },
        { id: 3, title: 'Related 2', tag: 'promotion' },
      ];
      NewsRepository.findRelatedByTag.mockResolvedValue(mockRelated);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of related news (max 3)');

      // Act
      const result = await NewsService.getRelated(input.tag, input.excludeId);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findRelatedByTag).toHaveBeenCalledWith('promotion', 1, 3);
      expect(result).toHaveLength(2);
    });

    it('NewsService - GET_RELATED - TC-2: should return empty when no tag', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsService - GET_RELATED - TC-2: Trả về rỗng khi không có tag');
      console.log('='.repeat(50));

      // INPUT
      const input = { tag: null, excludeId: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Empty array');

      // Act
      const result = await NewsService.getRelated(input.tag, input.excludeId);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got empty array');

      // Assert
      expect(result).toEqual([]);
      expect(NewsRepository.findRelatedByTag).not.toHaveBeenCalled();
    });
  });
});
