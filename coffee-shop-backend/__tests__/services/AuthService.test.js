const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
} = require('../../src/utils/helpers');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/utils/helpers');

describe('AuthService - Login', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedPassword123',
      isActive: true,
      first_name: 'Test',
      last_name: 'User',
      role_id: 1,
    };

    const mockUserWithRole = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      role_id: 1,
      role_name: 'Customer',
      isActive: true,
    };

    it('AuthService - LOGIN - TC-1: should login successfully with email', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-1: Đăng nhập thành công với email');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      UserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      const expectedOutput = {
        user: mockUserWithRole,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.login(input.identifier, input.password);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(comparePassword).toHaveBeenCalledWith('Password123!', mockUser.password);
      expect(UserRepository.findByIdWithRole).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedOutput);
      expect(result.user.password).toBeUndefined();
    });

    it('AuthService - LOGIN - TC-2: should login successfully with username', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-2: Đăng nhập thành công với username');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'testuser',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(mockUser);
      UserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      const expectedOutput = {
        user: mockUserWithRole,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.login(input.identifier, input.password);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('testuser');
      expect(UserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(comparePassword).toHaveBeenCalledWith('Password123!', mockUser.password);
      expect(result).toEqual(expectedOutput);
    });

    it('AuthService - LOGIN - TC-3: should throw error when user not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-3: Lỗi khi không tìm thấy user');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'nonexistent@example.com',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Email/Username hoặc mật khẩu không đúng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      try {
        await AuthService.login(input.identifier, input.password);
      } catch (error) {
        // OUTPUT REALITY
        console.log('🎯 OUTPUT REALITY: Error -', error.message);
        expect(error.message).toBe(expectedError);
      }

      expect(UserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(UserRepository.findByUsername).toHaveBeenCalledWith('nonexistent@example.com');
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('AuthService - LOGIN - TC-4: should throw error when user is not active', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-4: Lỗi khi tài khoản không active');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      UserRepository.findByEmail.mockResolvedValue(inactiveUser);

      // OUTPUT EXPECT
      const expectedError = 'Tài khoản đã bị vô hiệu hóa';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      try {
        await AuthService.login(input.identifier, input.password);
      } catch (error) {
        // OUTPUT REALITY
        console.log('🎯 OUTPUT REALITY: Error -', error.message);
        expect(error.message).toBe(expectedError);
      }

      expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('AuthService - LOGIN - TC-5: should throw error when password is incorrect', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-5: Lỗi khi mật khẩu không đúng');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'WrongPassword123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      // OUTPUT EXPECT
      const expectedError = 'Email/Username hoặc mật khẩu không đúng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      try {
        await AuthService.login(input.identifier, input.password);
      } catch (error) {
        // OUTPUT REALITY
        console.log('🎯 OUTPUT REALITY: Error -', error.message);
        expect(error.message).toBe(expectedError);
      }

      expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(comparePassword).toHaveBeenCalledWith('WrongPassword123!', mockUser.password);
      expect(UserRepository.findByIdWithRole).not.toHaveBeenCalled();
    });

    it('AuthService - LOGIN - TC-6: should generate correct tokens with user data', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-6: Tạo token đúng format với user data');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      UserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      const expectedTokenPayload = {
        id: mockUserWithRole.id,
        role_id: mockUserWithRole.role_id,
        first_name: mockUserWithRole.first_name,
        last_name: mockUserWithRole.last_name,
        email: mockUserWithRole.email,
      };
      console.log('\n✅ OUTPUT EXPECT: generateToken được gọi với:', JSON.stringify(expectedTokenPayload, null, 2));

      // Act
      await AuthService.login(input.identifier, input.password);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: generateToken đã được gọi đúng');

      // Assert
      expect(generateToken).toHaveBeenCalledWith({
        id: mockUserWithRole.id,
        role_id: mockUserWithRole.role_id,
        first_name: mockUserWithRole.first_name,
        last_name: mockUserWithRole.last_name,
        email: mockUserWithRole.email,
      });
      expect(generateRefreshToken).toHaveBeenCalledWith({
        id: mockUserWithRole.id,
      });
    });

    it('AuthService - LOGIN - TC-7: should not return password in response', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - LOGIN - TC-7: Không trả về password trong response');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        identifier: 'test@example.com',
        password: 'Password123!'
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const userWithPassword = { ...mockUserWithRole, password: 'hashedPassword123' };
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      UserRepository.findByIdWithRole.mockResolvedValue(userWithPassword);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      console.log('\n✅ OUTPUT EXPECT: user.password = undefined');

      // Act
      const result = await AuthService.login(input.identifier, input.password);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: user.password =', result.user.password);

      // Assert
      expect(result.user.password).toBeUndefined();
    });
  });
});
