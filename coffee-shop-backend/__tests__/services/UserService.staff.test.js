const UserService = require('../../src/services/UserService');
const UserRepository = require('../../src/repositories/UserRepository');
const EmailService = require('../../src/services/EmailService');
const { hashPassword, generateStrongPassword } = require('../../src/utils/helpers');
const { ROLES } = require('../../src/config/constants');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/services/EmailService');
jest.mock('../../src/utils/helpers', () => ({
  ...jest.requireActual('../../src/utils/helpers'),
  hashPassword: jest.fn(),
  generateStrongPassword: jest.fn(),
}));

describe('UserService - Staff Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock EmailService methods
    EmailService.sendStaffAccountEmail = jest.fn().mockResolvedValue({ success: true });
  });

  // ========== CREATE STAFF USER TESTS ==========
  describe('createStaffUser', () => {
    const mockStaffData = {
      email: 'staff@example.com',
      phone: '0912345678',
      username: 'staff_user',
      first_name: 'Staff',
      last_name: 'Member',
      gender: 1,
      dob: '1990-01-01',
      role_id: ROLES.STAFF,
    };

    const mockBaristaData = {
      email: 'barista@example.com',
      phone: '0987654321',
      username: 'barista_user',
      first_name: 'Barista',
      last_name: 'Pro',
      gender: 0,
      dob: '1995-05-15',
      role_id: ROLES.BARISTA,
    };

    // TC-1: Create staff successfully
    it('UserService - createStaffUser - TC-01: should create staff user successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-1: Tạo nhân viên thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.STAFF };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      generateStrongPassword.mockReturnValue('TempPass123!');
      hashPassword.mockResolvedValue('hashed-temp-password');

      const mockCreatedUser = {
        id: 101,
        email: input.email,
        phone: input.phone,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        gender: input.gender,
        dob: input.dob,
        role_id: ROLES.STAFF,
        isActive: 1,
        isVerified: 1,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);

      // OUTPUT EXPECT
      const expectedOutput = {
        user: {
          id: mockCreatedUser.id,
          email: mockCreatedUser.email,
          phone: mockCreatedUser.phone,
          username: mockCreatedUser.username,
          first_name: mockCreatedUser.first_name,
          last_name: mockCreatedUser.last_name,
          gender: mockCreatedUser.gender,
          dob: mockCreatedUser.dob,
          role_id: ROLES.STAFF,
          isActive: 1,
          isVerified: 1,
        },
        emailSent: true,
      };
      console.log('✅ OUTPUT EXPECT:', JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await UserService.createStaffUser(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(UserRepository.findByPhone).toHaveBeenCalledWith(input.phone);
      expect(UserRepository.findByUsername).toHaveBeenCalledWith(input.username);
      expect(generateStrongPassword).toHaveBeenCalledWith(12);
      expect(hashPassword).toHaveBeenCalledWith('TempPass123!');
      expect(UserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.email,
          phone: input.phone,
          username: input.username,
          role_id: ROLES.STAFF,
        })
      );
      expect(EmailService.sendStaffAccountEmail).toHaveBeenCalledWith(
        input.email,
        'Staff Member',
        'TempPass123!',
        'Phục vụ'
      );
      expect(result.user.role_id).toBe(ROLES.STAFF);
      expect(result.emailSent).toBe(true);
    });

    // TC-2: Create barista successfully
    it('UserService - createStaffUser - TC-02: should create barista user successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-2: Tạo pha chế viên thành công');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockBaristaData, role_id: ROLES.BARISTA };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      generateStrongPassword.mockReturnValue('BaristaPass456!');
      hashPassword.mockResolvedValue('hashed-barista-password');

      const mockCreatedUser = {
        id: 102,
        email: input.email,
        phone: input.phone,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        gender: input.gender,
        dob: input.dob,
        role_id: ROLES.BARISTA,
        isActive: 1,
        isVerified: 1,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);

      // OUTPUT EXPECT
      const expectedOutput = {
        user: {
          id: mockCreatedUser.id,
          email: mockCreatedUser.email,
          role_id: ROLES.BARISTA,
        },
        emailSent: true,
      };
      console.log('✅ OUTPUT EXPECT: Created barista successfully, email sent');

      // Act
      const result = await UserService.createStaffUser(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(UserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: ROLES.BARISTA,
        })
      );
      expect(EmailService.sendStaffAccountEmail).toHaveBeenCalledWith(
        input.email,
        'Barista Pro',
        'BaristaPass456!',
        'Pha chế'
      );
      expect(result.user.role_id).toBe(ROLES.BARISTA);
      expect(result.emailSent).toBe(true);
    });

    // TC-3: Email already exists
    it('UserService - createStaffUser - TC-03: should throw error when email already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-3: Lỗi khi email đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.STAFF };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const existingUser = { id: 1, email: input.email };
      UserRepository.findByEmail.mockResolvedValue(existingUser);

      // OUTPUT EXPECT
      const expectedError = 'Email đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(UserService.createStaffUser(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    // TC-4: Phone already exists
    it('UserService - createStaffUser - TC-04: should throw error when phone already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-4: Lỗi khi số điện thoại đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.STAFF };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      const existingUser = { id: 1, phone: input.phone };
      UserRepository.findByPhone.mockResolvedValue(existingUser);

      // OUTPUT EXPECT
      const expectedError = 'Số điện thoại đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(UserService.createStaffUser(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(UserRepository.findByPhone).toHaveBeenCalledWith(input.phone);
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    // TC-5: Username already exists
    it('UserService - createStaffUser - TC-05: should throw error when username already exists', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-5: Lỗi khi username đã tồn tại');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.STAFF };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      const existingUser = { id: 1, username: input.username };
      UserRepository.findByUsername.mockResolvedValue(existingUser);

      // OUTPUT EXPECT
      const expectedError = 'Username đã được sử dụng';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(UserService.createStaffUser(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(UserRepository.findByUsername).toHaveBeenCalledWith(input.username);
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    // TC-6: Invalid role
    it('UserService - createStaffUser - TC-06: should throw error when role is invalid', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-6: Lỗi khi role không hợp lệ');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.CUSTOMER }; // Invalid role for staff
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      const expectedError = 'Role không hợp lệ';
      console.log('✅ OUTPUT EXPECT: Error -', expectedError);

      // Act & Assert
      await expect(UserService.createStaffUser(input)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Thrown error -', expectedError);

      expect(UserRepository.findByEmail).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    // TC-7: Email service fails but user is created
    it('UserService - createStaffUser - TC-07: should create user even if email sending fails', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - CREATE_STAFF - TC-7: Tạo nhân viên thành công dù gửi email thất bại');
      console.log('='.repeat(50));

      // INPUT
      const input = { ...mockStaffData, role_id: ROLES.STAFF };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByPhone.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      generateStrongPassword.mockReturnValue('TempPass123!');
      hashPassword.mockResolvedValue('hashed-temp-password');

      const mockCreatedUser = {
        id: 103,
        email: input.email,
        phone: input.phone,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        role_id: ROLES.STAFF,
        isActive: 1,
        isVerified: 1,
      };
      UserRepository.create.mockResolvedValue(mockCreatedUser);
      EmailService.sendStaffAccountEmail.mockRejectedValue(new Error('Email service down'));

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: User created, but emailSent = false');

      // Act
      const result = await UserService.createStaffUser(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(result.user.id).toBe(103);
      expect(result.emailSent).toBe(false); // Email sending failed
      expect(UserRepository.create).toHaveBeenCalled();
    });
  });

  // ========== GET ALL STAFF TESTS ==========
  describe('getAllStaff', () => {
    // TC-1: Get all staff without pagination
    it('UserService - getAllStaff - TC-01: should get all staff and barista users', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - GET_ALL_STAFF - TC-1: Lấy tất cả nhân viên');
      console.log('='.repeat(50));

      // Arrange
      const mockStaffUsers = [
        { id: 1, first_name: 'Staff', last_name: 'One', email: 'staff1@example.com', role_id: ROLES.STAFF },
        { id: 2, first_name: 'Barista', last_name: 'One', email: 'barista1@example.com', role_id: ROLES.BARISTA },
      ];
      UserRepository.findByRole.mockResolvedValue(mockStaffUsers);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of staff members (both STAFF and BARISTA roles)');

      // Act
      const result = await UserService.getAllStaff();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got', result.length, 'staff members');

      // Assert
      expect(UserRepository.findByRole).toHaveBeenCalledTimes(2); // Called for STAFF and BARISTA
      expect(UserRepository.findByRole).toHaveBeenNthCalledWith(1, ROLES.STAFF, {});
      expect(UserRepository.findByRole).toHaveBeenNthCalledWith(2, ROLES.BARISTA, {});
      expect(result.length).toBe(4); // 2 from STAFF + 2 from BARISTA (mocked same result)
      expect(result[0].password).toBeUndefined(); // Password should be removed
    });

    // TC-2: Get staff with pagination
    it('UserService - getAllStaff - TC-02: should get staff with pagination options', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - GET_ALL_STAFF - TC-2: Lấy nhân viên với phân trang');
      console.log('='.repeat(50));

      // INPUT
      const input = { limit: 10, offset: 0, orderBy: 'first_name', order: 'ASC' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockStaffUsers = [
        { id: 1, first_name: 'Alice', last_name: 'Staff', role_id: ROLES.STAFF },
        { id: 2, first_name: 'Bob', last_name: 'Barista', role_id: ROLES.BARISTA },
      ];
      UserRepository.findByRole.mockResolvedValue(mockStaffUsers);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Paginated staff list with specified limit/offset');

      // Act
      const result = await UserService.getAllStaff(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got', result.length, 'staff members');

      // Assert
      expect(UserRepository.findByRole).toHaveBeenCalledWith(ROLES.STAFF, input);
      expect(UserRepository.findByRole).toHaveBeenCalledWith(ROLES.BARISTA, input);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ========== GET USERS BY ROLE TESTS ==========
  describe('getUsersByRole', () => {
    // TC-1: Get staff by role
    it('UserService - getUsersByRole - TC-01: should get all staff users by role', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - GET_USERS_BY_ROLE - TC-1: Lấy tất cả nhân viên theo role');
      console.log('='.repeat(50));

      // Arrange
      const mockStaffUsers = [
        { id: 1, first_name: 'Staff', last_name: 'One', email: 'staff1@example.com', role_id: ROLES.STAFF },
        { id: 2, first_name: 'Staff', last_name: 'Two', email: 'staff2@example.com', role_id: ROLES.STAFF },
      ];
      UserRepository.findByRole.mockResolvedValue(mockStaffUsers);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of staff users with role_id =', ROLES.STAFF);

      // Act
      const result = await UserService.getUsersByRole(ROLES.STAFF);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got', result.length, 'staff users');

      // Assert
      expect(UserRepository.findByRole).toHaveBeenCalledWith(ROLES.STAFF, {});
      expect(result.length).toBe(2);
      expect(result[0].password).toBeUndefined();
      expect(result.every(u => u.role_id === ROLES.STAFF)).toBe(true);
    });

    // TC-2: Get barista by role with options
    it('UserService - getUsersByRole - TC-02: should get barista with pagination', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - GET_USERS_BY_ROLE - TC-2: Lấy pha chế viên với phân trang');
      console.log('='.repeat(50));

      // INPUT
      const input = { limit: 5, offset: 0 };
      console.log('\n📝 INPUT: roleId =', ROLES.BARISTA, ',', JSON.stringify(input, null, 2));

      // Arrange
      const mockBaristaUsers = [
        { id: 3, first_name: 'Barista', last_name: 'One', email: 'barista1@example.com', role_id: ROLES.BARISTA },
      ];
      UserRepository.findByRole.mockResolvedValue(mockBaristaUsers);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Paginated barista list');

      // Act
      const result = await UserService.getUsersByRole(ROLES.BARISTA, input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got', result.length, 'barista users');

      // Assert
      expect(UserRepository.findByRole).toHaveBeenCalledWith(ROLES.BARISTA, input);
      expect(result.every(u => u.role_id === ROLES.BARISTA)).toBe(true);
    });
  });

  // ========== SEARCH USERS TESTS ==========
  describe('searchUsers', () => {
    // TC-1: Search staff by keyword
    it('UserService - searchUsers - TC-01: should search staff by keyword', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - SEARCH_USERS - TC-1: Tìm kiếm nhân viên theo từ khóa');
      console.log('='.repeat(50));

      // INPUT
      const input = { keyword: 'Staff' };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockSearchResults = [
        { id: 1, first_name: 'Staff', last_name: 'One', email: 'staff1@example.com', role_id: ROLES.STAFF },
        { id: 2, first_name: 'Staff', last_name: 'Two', email: 'staff2@example.com', role_id: ROLES.STAFF },
      ];
      UserRepository.search.mockResolvedValue(mockSearchResults);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of users matching keyword "Staff"');

      // Act
      const result = await UserService.searchUsers(input.keyword);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Found', result.length, 'users');

      // Assert
      expect(UserRepository.search).toHaveBeenCalledWith('Staff', {});
      expect(result.length).toBe(2);
      expect(result[0].password).toBeUndefined();
    });

    // TC-2: Search with empty keyword
    it('UserService - searchUsers - TC-02: should return all users when keyword is empty', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - SEARCH_USERS - TC-2: Trả về tất cả user khi keyword trống');
      console.log('='.repeat(50));

      // Arrange
      const mockAllUsers = [
        { id: 1, first_name: 'User', last_name: 'One', email: 'user1@example.com' },
      ];
      UserRepository.findAll.mockResolvedValue(mockAllUsers);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: All users list (empty keyword returns all users)');

      // Act
      const result = await UserService.searchUsers('');

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got all users, count =', result.length);

      // Assert
      expect(UserRepository.findAll).toHaveBeenCalled();
      expect(UserRepository.search).not.toHaveBeenCalled();
    });

    // TC-3: Search with options
    it('UserService - searchUsers - TC-03: should search with pagination options', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('UserService - SEARCH_USERS - TC-3: Tìm kiếm với phân trang');
      console.log('='.repeat(50));

      // INPUT
      const input = { keyword: 'john', limit: 10, offset: 0 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockResults = [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      ];
      UserRepository.search.mockResolvedValue(mockResults);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Paginated search results for keyword "john"');

      // Act
      const result = await UserService.searchUsers(input.keyword, { limit: input.limit, offset: input.offset });

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Found', result.length, 'matching users');

      // Assert
      expect(UserRepository.search).toHaveBeenCalledWith('john', { limit: input.limit, offset: input.offset });
      expect(result.length).toBe(1);
    });
  });
});
