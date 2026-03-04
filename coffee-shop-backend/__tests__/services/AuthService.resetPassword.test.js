const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const EmailVerificationRepository = require('../../src/repositories/EmailVerificationRepository');
const { hashPassword, comparePassword } = require('../../src/utils/helpers');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/repositories/EmailVerificationRepository');
jest.mock('../../src/utils/helpers');

describe('AuthService - Reset Password Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // method 1: resetPassword (send OTP)
  describe('resetPassword', () => {
    const mockUser = {
      id: 1,
      email: 'chuthevan450@gmail.com',
      first_name: 'Test',
      last_name: 'User',
    };

    it('AuthService - RESET_PASSWORD - TC-1: should send OTP successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD - TC-1: Gửi OTP thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue('hashed-otp');
      EmailVerificationRepository.create.mockResolvedValue({ id: 1 });

      // OUTPUT EXPECT
      const expectedOutput = {
        message: 'Mã OTP đã được gửi đến email của bạn',
        otp: expect.any(String),
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify({ message: 'Mã OTP đã được gửi đến email của bạn' }, null, 2));

      // Act
      const result = await AuthService.resetPassword(input.email);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(hashPassword).toHaveBeenCalled();
      expect(EmailVerificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          otp_hash: 'hashed-otp',
        })
      );
      expect(result.message).toBe('Mã OTP đã được gửi đến email của bạn');
    });

    it('AuthService - RESET_PASSWORD - TC-2: should throw error when email not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD - TC-2: Lỗi khi email không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'notfound@example.com',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Email không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPassword(input.email)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(EmailVerificationRepository.create).not.toHaveBeenCalled();
    });
  });

  // method 2: verifyForgotPasswordOtp
  describe('verifyForgotPasswordOtp', () => {
    const mockUser = {
      id: 1,
      email: 'chuthevan450@gmail.com',
    };

    const mockOtpRecord = {
      id: 1,
      user_id: 1,
      otp_hash: 'hashed-otp',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      failed_attempts: 0,
    };

    it('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-1: should verify OTP successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-1: Xác thực OTP thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedOutput = {
        message: 'OTP xác thực thành công',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.verifyForgotPasswordOtp(input.email, input.otp);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(EmailVerificationRepository.findLatestValidByUser).toHaveBeenCalledWith(mockUser.id);
      expect(comparePassword).toHaveBeenCalledWith(input.otp, mockOtpRecord.otp_hash);
      expect(result).toEqual(expectedOutput);
    });

    it('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-2: should throw error when email not found', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-2: Lỗi khi email không tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'notfound@example.com',
        otp: '12345678',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = 'Email không tồn tại';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.verifyForgotPasswordOtp(input.email, input.otp)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    });

    it('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-3: should throw error when OTP is incorrect', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-3: Lỗi khi OTP không đúng');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: 'wrongotp',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(false);
      EmailVerificationRepository.incrementFailed.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedError = 'OTP không đúng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.verifyForgotPasswordOtp(input.email, input.otp)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(comparePassword).toHaveBeenCalledWith(input.otp, mockOtpRecord.otp_hash);
      expect(EmailVerificationRepository.incrementFailed).toHaveBeenCalledWith(mockOtpRecord.id);
    });

    it('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-4: should throw error when OTP is expired', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-4: Lỗi khi OTP đã hết hạn');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const expiredOtpRecord = {
        ...mockOtpRecord,
        expires_at: new Date(Date.now() - 1000), // Expired
      };
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(expiredOtpRecord);

      // OUTPUT EXPECT
      const expectedError = 'OTP đã hết hạn';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.verifyForgotPasswordOtp(input.email, input.otp)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(EmailVerificationRepository.findLatestValidByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-5: should throw error when too many failed attempts', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - VERIFY_FORGOT_PASSWORD_OTP - TC-5: Lỗi khi nhập sai OTP quá nhiều lần');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const tooManyFailedRecord = {
        ...mockOtpRecord,
        failed_attempts: 5,
      };
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(tooManyFailedRecord);

      // OUTPUT EXPECT
      const expectedError = 'Bạn đã nhập sai OTP quá nhiều lần';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.verifyForgotPasswordOtp(input.email, input.otp)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(EmailVerificationRepository.findLatestValidByUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // method 3: resetPasswordWithOtp
  describe('resetPasswordWithOtp', () => {
    const mockUser = {
      id: 1,
      email: 'chuthevan450@gmail.com',
    };

    const mockOtpRecord = {
      id: 1,
      user_id: 1,
      otp_hash: 'hashed-otp',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      failed_attempts: 0,
    };

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-1: should reset password successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-1: Reset password thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password');
      UserRepository.updatePassword.mockResolvedValue(true);
      EmailVerificationRepository.markUsed.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedOutput = {
        message: 'Mật khẩu đã được đặt lại thành công',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(comparePassword).toHaveBeenCalledWith(input.otp, mockOtpRecord.otp_hash);
      expect(hashPassword).toHaveBeenCalledWith(input.newPassword);
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(mockUser.id, 'hashed-new-password');
      expect(EmailVerificationRepository.markUsed).toHaveBeenCalledWith(mockOtpRecord.id);
      expect(result).toEqual(expectedOutput);
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-2: should throw error when passwords do not match', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-2: Lỗi khi mật khẩu mới và confirm password không khớp');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu xác thực không khớp';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-3: should throw error when OTP is incorrect', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-3: Lỗi khi OTP không đúng');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: 'wrongotp',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(false);

      // OUTPUT EXPECT
      const expectedError = 'OTP không đúng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(comparePassword).toHaveBeenCalledWith(input.otp, mockOtpRecord.otp_hash);
      expect(UserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-4: should throw error when new password is less than 8 characters', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-4: Lỗi khi mật khẩu mới ngắn hơn 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Ab1!abc',
        confirmPassword: 'Ab1!abc',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-5: should throw error when new password is greater than 20 characters', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-5: Lỗi khi mật khẩu mới dài hơn 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Ab1!Ab1!Ab1!Ab1!Ab1!A',
        confirmPassword: 'Ab1!Ab1!Ab1!Ab1!Ab1!A',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-6: should throw error when new password has no uppercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-6: Lỗi khi mật khẩu mới không có chữ hoa');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'password123!',
        confirmPassword: 'password123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ hoa (A-Z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-7: should throw error when new password has no lowercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-7: Lỗi khi mật khẩu mới không có chữ thường');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'PASSWORD123!',
        confirmPassword: 'PASSWORD123!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ thường (a-z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-8: should throw error when new password has no number', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-8: Lỗi khi mật khẩu mới không có số');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Password!!',
        confirmPassword: 'Password!!',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa số (0-9)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-9: should throw error when new password has no special character', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-9: Lỗi khi mật khẩu mới không có ký tự đặc biệt');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa ký tự đặc biệt (!@#$...)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-10: should reset password successfully with minimum length (8)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-10: Reset password thành công với mật khẩu dài 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Aa1!aaaa',
        confirmPassword: 'Aa1!aaaa',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password-8');
      UserRepository.updatePassword.mockResolvedValue(true);
      EmailVerificationRepository.markUsed.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedOutput = {
        message: 'Mật khẩu đã được đặt lại thành công',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!aaaa');
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(mockUser.id, 'hashed-new-password-8');
      expect(result).toEqual(expectedOutput);
    });

    it('AuthService - RESET_PASSWORD_WITH_OTP - TC-11: should reset password successfully with maximum length (20)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - RESET_PASSWORD_WITH_OTP - TC-11: Reset password thành công với mật khẩu dài 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = {
        email: 'chuthevan450@gmail.com',
        otp: '12345678',
        newPassword: 'Aa1!abcdefghijklmnoP',
        confirmPassword: 'Aa1!abcdefghijklmnoP',
      };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(mockUser);
      EmailVerificationRepository.findLatestValidByUser.mockResolvedValue(mockOtpRecord);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new-password-20');
      UserRepository.updatePassword.mockResolvedValue(true);
      EmailVerificationRepository.markUsed.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedOutput = {
        message: 'Mật khẩu đã được đặt lại thành công',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.resetPasswordWithOtp(input.email, input.otp, input.newPassword, input.confirmPassword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!abcdefghijklmnoP');
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(mockUser.id, 'hashed-new-password-20');
      expect(result).toEqual(expectedOutput);
    });
  });
});
