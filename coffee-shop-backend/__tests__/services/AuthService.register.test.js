const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const {
  hashPassword,
  generateToken,
  generateRefreshToken,
} = require('../../src/utils/helpers');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/utils/helpers');

describe('AuthService - Register', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerBaseInput = {
      first_name: 'Test',
      last_name: 'User',
      email: 'newuser@example.com',
      phone: '0912345678',
      username: 'newuser',
      password: 'Password123!',
    };

    const buildRegisterInput = (overrides = {}) => ({
      ...registerBaseInput,
      ...overrides,
    });

    it('AuthService - register - TC-01: should register successfully with valid input', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-1: Đăng ký thành công với input hợp lệ');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'valid.tc1@example.com',
        phone: '0912345601',
        username: 'valid_tc1',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed-password');
      
      const mockCreatedUser = {
        id: 100,
        email: input.email,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        role_id: 4,
        isActive: 1,
        isVerified: 0,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      const expectedOutput = {
        user: {
          id: mockCreatedUser.id,
          email: mockCreatedUser.email,
          username: mockCreatedUser.username,
          first_name: mockCreatedUser.first_name,
          last_name: mockCreatedUser.last_name,
          role_id: mockCreatedUser.role_id,
          isActive: mockCreatedUser.isActive,
          isVerified: mockCreatedUser.isVerified,
        },
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await AuthService.register(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(UserRepository.findByPhone).toHaveBeenCalledWith(input.phone);
      expect(UserRepository.findByUsername).toHaveBeenCalledWith(input.username);
      expect(hashPassword).toHaveBeenCalledWith(input.password);
      expect(UserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.email,
          phone: input.phone,
          username: input.username,
          password: 'hashed-password',
          first_name: input.first_name,
          last_name: input.last_name,
          isActive: 1,
          isVerified: 0,
        })
      );
      expect(generateToken).toHaveBeenCalled();
      expect(generateRefreshToken).toHaveBeenCalledWith({ id: mockCreatedUser.id });
      expect(result).toEqual(expectedOutput);
    });

    it('AuthService - register - TC-02: should throw error when email already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-2: Lỗi khi email đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'newuser@example.com',
        phone: '0923456781',
        username: 'newuser2',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue({ id: 1, email: input.email });

      // OUTPUT EXPECT
      const expectedError = 'Email đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow('Email đã được sử dụng');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(UserRepository.findByPhone).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-03: should throw error when phone already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-3: Lỗi khi số điện thoại đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'newuser2@example.com',
        phone: '0912345678',
        username: 'newuser2',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue({ id: 1, phone: input.phone });

      // OUTPUT EXPECT
      const expectedError = 'Số điện thoại đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow('Số điện thoại đã được sử dụng');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByPhone).toHaveBeenCalledWith(input.phone);
      expect(UserRepository.findByUsername).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-04: should throw error when username already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-4: Lỗi khi username đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'newuser2@example.com',
        phone: '0923456781',
        username: 'newuser',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue({ id: 1, username: input.username });

      // OUTPUT EXPECT
      const expectedError = 'Username đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow('Username đã được sử dụng');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByUsername).toHaveBeenCalledWith(input.username);
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-05: should register successfully with minimum password length (8)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-5: Đăng ký thành công với mật khẩu dài 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.min8.tc5@example.com',
        phone: '0912345605',
        username: 'pass_min8_tc5',
        password: 'Aa1!aaaa',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed-password-min-8');
      
      const mockCreatedUser = {
        id: 105,
        email: input.email,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        role_id: 4,
        isActive: 1,
        isVerified: 0,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Register thành công');

      // Act
      const result = await AuthService.register(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!aaaa');
      expect(UserRepository.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('AuthService - register - TC-06: should register successfully with maximum password length (20)', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-6: Đăng ký thành công với mật khẩu dài 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.max20.tc6@example.com',
        phone: '0912345606',
        username: 'pass_max20_tc6',
        password: 'Aa1!abcdefghijklmnoP',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed-password-max-20');
      
      const mockCreatedUser = {
        id: 106,
        email: input.email,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        role_id: 4,
        isActive: 1,
        isVerified: 0,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);
      generateToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Register thành công');

      // Act
      const result = await AuthService.register(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('Aa1!abcdefghijklmnoP');
      expect(UserRepository.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('AuthService - register - TC-07: should throw error when password length is less than 8', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-7: Lỗi khi mật khẩu ngắn hơn 8 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.short.tc7@example.com',
        phone: '0912345607',
        username: 'pass_short_tc7',
        password: 'Ab1!abc',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-08: should throw error when password length is greater than 20', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-8: Lỗi khi mật khẩu dài hơn 20 ký tự');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.long.tc8@example.com',
        phone: '0912345608',
        username: 'pass_long_tc8',
        password: 'Ab1!Ab1!Ab1!Ab1!Ab1!A',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải từ 8-20 ký tự';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-09: should throw error when password has no uppercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-9: Lỗi khi mật khẩu không có chữ hoa');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.noupper.tc9@example.com',
        phone: '0912345609',
        username: 'pass_noupper_tc9',
        password: 'password123!',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ hoa (A-Z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-10: should throw error when password has no lowercase letter', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-10: Lỗi khi mật khẩu không có chữ thường');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.nolower.tc10@example.com',
        phone: '0912345610',
        username: 'pass_nolower_tc10',
        password: 'PASSWORD123!',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa chữ thường (a-z)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-11: should throw error when password has no number', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-11: Lỗi khi mật khẩu không có số');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.nonumber.tc11@example.com',
        phone: '0912345611',
        username: 'pass_nonumber_tc11',
        password: 'Password!!',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa số (0-9)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-12: should throw error when password has no special character', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AuthService - REGISTER - TC-12: Lỗi khi mật khẩu không có ký tự đặc biệt');
      console.log('='.repeat(50));

      // INPUT
      const input = buildRegisterInput({
        email: 'pass.nospecial.tc12@example.com',
        phone: '0912345612',
        username: 'pass_nospecial_tc12',
        password: 'Password123',
      });
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Mật khẩu phải chứa ký tự đặc biệt (!@#$...)';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(AuthService.register(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: throw error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-13: should throw error when phone is full-space string', async () => {
      const input = buildRegisterInput({
        email: 'space.phone.tc13@example.com',
        phone: '        ',
        username: 'space_phone_tc13',
      });

      await expect(AuthService.register(input)).rejects.toThrow(
        'Số điện thoại phải có 10-11 chữ số hoặc bắt đầu bằng +84'
      );

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('AuthService - register - TC-14: should throw error when email format is invalid', async () => {
      const input = buildRegisterInput({
        email: 'invalid-email-format',
        phone: '0912345614',
        username: 'invalid_email_tc14',
      });

      await expect(AuthService.register(input)).rejects.toThrow('Email không hợp lệ');

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });
  });
});
