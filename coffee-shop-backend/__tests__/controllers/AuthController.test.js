const AuthController = require('../../src/controllers/AuthController');
const AuthService = require('../../src/services/AuthService');
const response = require('../../src/utils/response');

// Mock dependencies
jest.mock('../../src/services/AuthService');
jest.mock('../../src/utils/response');

describe('AuthController - Login', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request, response, and next
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Mock response utility
    response.success = jest.fn();
    response.error = jest.fn();
  });

  describe('login', () => {
    it('AuthController - Login - TC-1: should login successfully with valid credentials', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-1: Controller xử lý login thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResult = {
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role_id: 1,
        },
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      req.body = input;
      AuthService.login.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(mockResult, null, 2));

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: response.success called with result');

      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Đăng nhập thành công'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('AuthController - Login - TC-2: should login successfully with username', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-2: Controller xử lý login với username');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'testuser',
        password: 'Password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResult = {
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role_id: 1,
        },
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      req.body = input;
      AuthService.login.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log('\n✅ OUTPUT EXPECT:', JSON.stringify(mockResult, null, 2));

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: response.success called with result');

      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('testuser', 'Password123!');
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Đăng nhập thành công'
      );
    });

    it('AuthController - Login - TC-3: should call next with error when login fails', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-3: Controller xử lý lỗi login');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'WrongPassword!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockError = new Error('Email/Username hoặc mật khẩu không đúng');
      req.body = input;
      AuthService.login.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Error -', mockError.message);

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: next() called with error -', mockError.message);

      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'WrongPassword!');
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });

    it('AuthController - Login - TC-4: should handle inactive user error', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-4: Controller xử lý lỗi tài khoản không active');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockError = new Error('Tài khoản đã bị vô hiệu hóa');
      req.body = input;
      AuthService.login.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log('\n✅ OUTPUT EXPECT: Error -', mockError.message);

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: next() called with error -', mockError.message);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });

    it('AuthController - Login - TC-5: should handle user not found error', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-5: Controller xử lý lỗi user không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'nonexistent@example.com',
        password: 'Password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockError = new Error('Email/Username hoặc mật khẩu không đúng');
      req.body = input;
      AuthService.login.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log('\n✅ OUTPUT EXPECT: Error -', mockError.message);

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: next() called with error -', mockError.message);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('AuthController - Login - TC-6: should handle service errors gracefully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthController - Login - TC-6: Controller xử lý lỗi hệ thống');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockError = new Error('Database connection failed');
      req.body = input;
      AuthService.login.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log('\n✅ OUTPUT EXPECT: Error -', mockError.message);

      // Act
      await AuthController.login(req, res, next);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: next() called with error -', mockError.message);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });
});
