const NewsletterService = require('../../src/services/NewsletterService');
const NewsletterRepository = require('../../src/repositories/NewsletterRepository');

// Mock dependencies
jest.mock('../../src/repositories/NewsletterRepository');

describe('NewsletterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== SUBSCRIBE TESTS ==========
  describe('subscribe', () => {
    it('NewsletterService - SUBSCRIBE - TC-1: should subscribe successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - SUBSCRIBE - TC-1: Đăng ký newsletter thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { email: 'newuser@example.com' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsletterRepository.findByEmail.mockResolvedValue(null);
      const mockSubscription = { id: 1, email: input.email, subscribed_at: new Date() };
      NewsletterRepository.create.mockResolvedValue(mockSubscription);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Created subscription with id = 1');

      // Act
      const result = await NewsletterService.subscribe(input.email);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsletterRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(NewsletterRepository.create).toHaveBeenCalledWith(input.email);
      expect(result.id).toBe(1);
      expect(result.email).toBe(input.email);
    });

    it('NewsletterService - SUBSCRIBE - TC-2: should throw error when email already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - SUBSCRIBE - TC-2: Lỗi khi email đã đăng ký');
      console.log('='.repeat(50));

      // INPUT
      const input = { email: 'existing@example.com' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingSubscription = { id: 1, email: input.email };
      NewsletterRepository.findByEmail.mockResolvedValue(existingSubscription);

      // OUTPUT EXPECT
      const expectedError = 'Email đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(NewsletterService.subscribe(input.email)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(NewsletterRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(NewsletterRepository.create).not.toHaveBeenCalled();
    });
  });

  // ========== GET ALL TESTS ==========
  describe('getAll', () => {
    it('NewsletterService - GET_ALL - TC-1: should get all newsletter subscriptions', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - GET_ALL - TC-1: Lấy tất cả đăng ký newsletter');
      console.log('='.repeat(50));

      // Arrange
      const mockSubscriptions = [
        { id: 1, email: 'user1@example.com', subscribed_at: new Date() },
        { id: 2, email: 'user2@example.com', subscribed_at: new Date() },
      ];
      NewsletterRepository.findAll.mockResolvedValue(mockSubscriptions);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of newsletter subscriptions');

      // Act
      const result = await NewsletterService.getAll();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(NewsletterRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('email');
    });

    it('NewsletterService - GET_ALL - TC-2: should return empty array when no subscriptions', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - GET_ALL - TC-2: Trả về mảng rỗng khi không có đăng ký');
      console.log('='.repeat(50));

      // Arrange
      NewsletterRepository.findAll.mockResolvedValue([]);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Empty array');

      // Act
      const result = await NewsletterService.getAll();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got empty array, length =', result.length);

      // Assert
      expect(NewsletterRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  // ========== DELETE TESTS ==========
  describe('delete', () => {
    it('NewsletterService - DELETE - TC-1: should delete subscription successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - DELETE - TC-1: Xóa đăng ký thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsletterRepository.delete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Subscription deleted');

      // Act
      const result = await NewsletterService.delete(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(NewsletterRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('NewsletterService - DELETE - TC-2: should handle delete failure', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('NewsletterService - DELETE - TC-2: Xử lý khi xóa thất bại');
      console.log('='.repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      NewsletterRepository.delete.mockResolvedValue(false);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Delete returns false');

      // Act
      const result = await NewsletterService.delete(input.id);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Deleted =', result);

      // Assert
      expect(NewsletterRepository.delete).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });
});
