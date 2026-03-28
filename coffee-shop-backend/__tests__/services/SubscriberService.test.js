const SubscriberService = require('../../src/services/SubscriberService');
const subscriberRepository = require('../../src/repositories/SubscriberRepository');

jest.mock('../../src/repositories/SubscriberRepository');

describe('SubscriberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('SubscriberService - subscribe - TC-1: should throw an error if email already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('SubscriberService - subscribe - TC-1: Báo lỗi nếu đã subscribe');
      console.log('='.repeat(50));

      const input = { email: 'test@example.com' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      subscriberRepository.findByEmail.mockResolvedValue({ id: 1, email: input.email });

      const expectedError = 'Email đã tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      try {
        await SubscriberService.subscribe(input.email);
      } catch (error) {
        console.log('🎯 OUTPUT REALITY: Error -', error.message);
        expect(error.message).toBe(expectedError);
      }

      expect(subscriberRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(subscriberRepository.create).not.toHaveBeenCalled();
    });

    it('SubscriberService - subscribe - TC-2: should create a new subscription if email does not exist', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('SubscriberService - subscribe - TC-2: Tạo subscriber mới');
      console.log('='.repeat(50));

      const input = { email: 'new@example.com' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      subscriberRepository.findByEmail.mockResolvedValue(null);
      subscriberRepository.create.mockResolvedValue({ id: 2, email: input.email });

      const expectedOutput = { id: 2, email: input.email };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      const result = await SubscriberService.subscribe(input.email);

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(subscriberRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(subscriberRepository.create).toHaveBeenCalledWith(input.email);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('getAll', () => {
    it('SubscriberService - getAll - TC-1: should return all subscribers', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('SubscriberService - getAll - TC-1: Lấy danh sách subscribers');
      console.log('='.repeat(50));

      const mockSubscribers = [{ id: 1, email: 'a@example.com' }, { id: 2, email: 'b@example.com' }];
      subscriberRepository.findAll.mockResolvedValue(mockSubscribers);

      console.log('\n📝 INPUT: Không có');
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockSubscribers, null, 2));

      const result = await SubscriberService.getAll();

      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      expect(subscriberRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockSubscribers);
    });
  });

  describe('delete', () => {
    it('SubscriberService - delete - TC-1: should logically delete a subscriber', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('SubscriberService - delete - TC-1: Xóa subscriber');
      console.log('='.repeat(50));

      const input = { id: 1 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      subscriberRepository.delete.mockResolvedValue(true);

      console.log('✅ OUTPUT EXPECT: true');

      const result = await SubscriberService.delete(input.id);

      console.log('🎯 OUTPUT REALITY:', result);

      expect(subscriberRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
