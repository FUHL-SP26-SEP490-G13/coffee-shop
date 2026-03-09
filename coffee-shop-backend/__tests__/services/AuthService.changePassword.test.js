const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const {
  hashPassword,
  comparePassword,
} = require('../../src/utils/helpers');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/utils/helpers');

describe('AuthService - ChangePassword', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('changePassword', () => {
    const userId = 1;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    const mockUser = {
      id: userId,
      password: 'hashed-old-password',
    };

    it('AuthService - CHANGE_PASSWORD - TC-1: should change password successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-1: Đổi mật khẩu thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password');
      UserRepository.updatePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: true');

      // Act
      const result = await AuthService.changePassword(userId, oldPassword, newPassword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', result);

      // Assert
      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(comparePassword).toHaveBeenCalledWith(oldPassword, mockUser.password);
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(userId, 'hashed-new-password');
      expect(result).toBe(true);
    });

    it('AuthService - CHANGE_PASSWORD - TC-2: should throw error when old password is incorrect', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-2: Lỗi khi mật khẩu cũ không đúng');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword: 'WrongPassword123!',
        newPassword,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu cũ không đúng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, 'WrongPassword123!', newPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(comparePassword).toHaveBeenCalledWith('WrongPassword123!', mockUser.password);
      expect(hashPassword).not.toHaveBeenCalled();
      expect(UserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-3: should throw error when user not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-3: Lỗi khi user không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId: 999,
        oldPassword,
        newPassword,
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'User không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(999, oldPassword, newPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findById).toHaveBeenCalledWith(999);
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-4: should throw error when new password is less than 8 characters', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-4: Lỗi khi mật khẩu mới ngắn hơn 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Ab1!abc',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'Ab1!abc')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-5: should throw error when new password is greater than 20 characters', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-5: Lỗi khi mật khẩu mới dài hơn 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Ab1!Ab1!Ab1!Ab1!Ab1!A',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'Ab1!Ab1!Ab1!Ab1!Ab1!A')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-6: should throw error when new password has no uppercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-6: Lỗi khi mật khẩu mới không có chữ hoa');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ hoa (A-Z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'password123!')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-7: should throw error when new password has no lowercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-7: Lỗi khi mật khẩu mới không có chữ thường');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'PASSWORD123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ thường (a-z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'PASSWORD123!')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-8: should throw error when new password has no number', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-8: Lỗi khi mật khẩu mới không có số');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Password!!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa số (0-9)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'Password!!')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-9: should throw error when new password has no special character', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-9: Lỗi khi mật khẩu mới không có ký tự đặc biệt');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Password123',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa ký tự đặc biệt (!@#$...)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.changePassword(userId, oldPassword, 'Password123')).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('AuthService - CHANGE_PASSWORD - TC-10: should change password successfully with minimum length (8)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-10: Đổi mật khẩu thành công với mật khẩu dài 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Aa1!aaaa',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password-8');
      UserRepository.updatePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: true');

      // Act
      const result = await AuthService.changePassword(userId, oldPassword, 'Aa1!aaaa');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', result);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!aaaa');
      expect(UserRepository.updatePassword).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('AuthService - CHANGE_PASSWORD - TC-11: should change password successfully with maximum length (20)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - CHANGE_PASSWORD - TC-11: Đổi mật khẩu thành công với mật khẩu dài 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        userId,
        oldPassword,
        newPassword: 'Aa1!abcdefghijklmnoP',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findById.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password-20');
      UserRepository.updatePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: true');

      // Act
      const result = await AuthService.changePassword(userId, oldPassword, 'Aa1!abcdefghijklmnoP');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', result);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!abcdefghijklmnoP');
      expect(UserRepository.updatePassword).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
