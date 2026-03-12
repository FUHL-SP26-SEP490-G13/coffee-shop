# Testing Guide - Coffee Shop Backend

## Giới thiệu
Dự án sử dụng **Jest** để test các chức năng của ứng dụng.

## Cài đặt

Các dependencies đã được cài đặt trong `package.json`:
- `jest`: Framework testing
- Đã cấu hình trong `jest.config.js`

## Chạy tests

### Chạy tất cả tests
```bash
npm test
```

### Chạy test với coverage
```bash
npm test -- --coverage
```

### Chạy một file test cụ thể
```bash
npm test AuthService.test.js
```

### Chạy test ở watch mode
```bash
npm test -- --watch
```

## Cấu trúc Tests

```
__tests__/
├── controllers/
│   └── AuthController.test.js    # Test cho AuthController
└── services/
    └── AuthService.test.js        # Test cho AuthService
```

## Test Coverage - Login Feature

### AuthService.test.js
Test các chức năng của AuthService.login():
- ✅ Đăng nhập thành công với email
- ✅ Đăng nhập thành công với username
- ✅ Lỗi khi không tìm thấy user
- ✅ Lỗi khi tài khoản bị vô hiệu hóa
- ✅ Lỗi khi mật khẩu sai
- ✅ Tạo token đúng format
- ✅ Không trả về password trong response

### AuthController.test.js
Test các chức năng của AuthController.login():
- ✅ Xử lý request login thành công với email
- ✅ Xử lý request login thành công với username
- ✅ Xử lý lỗi từ service layer
- ✅ Xử lý lỗi tài khoản không active
- ✅ Xử lý lỗi user không tồn tại
- ✅ Xử lý lỗi hệ thống

## Ví dụ Test Case

### Test đăng nhập thành công
```javascript
it('should login successfully with email', async () => {
  // Arrange - Chuẩn bị dữ liệu test
  UserRepository.findByEmail.mockResolvedValue(mockUser);
  comparePassword.mockResolvedValue(true);
  
  // Act - Thực thi function cần test
  const result = await AuthService.login('test@example.com', 'Password123!');
  
  // Assert - Kiểm tra kết quả
  expect(result).toEqual({
    user: mockUserWithRole,
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  });
});
```

## Mocking Strategy

### Mocked Dependencies
- `UserRepository`: Mock các phương thức database
- `helpers`: Mock các hàm hash, compare password, generate tokens
- `response`: Mock response utilities

### Best Practices
1. Sử dụng `jest.clearAllMocks()` trước mỗi test
2. Mock tất cả external dependencies
3. Test cả success và error cases
4. Verify function calls với `toHaveBeenCalledWith()`
5. Test boundary conditions

## Kết quả mong đợi

Khi chạy `npm test`, bạn sẽ thấy output tương tự:
```
PASS  __tests__/services/AuthService.test.js
PASS  __tests__/controllers/AuthController.test.js

Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        X.XXXs
```

## Troubleshooting

### Lỗi "Cannot find module"
```bash
npm install
```

### Lỗi timeout
Tăng timeout trong `jest.config.js`:
```javascript
testTimeout: 10000
```

## Mở rộng

Để thêm test cho các chức năng khác:
1. Tạo file test trong thư mục tương ứng: `__tests__/controllers/` hoặc `__tests__/services/`
2. Import module cần test
3. Mock dependencies
4. Viết test cases theo pattern AAA (Arrange-Act-Assert)

## Tài liệu tham khảo
- [Jest Documentation](https://jestjs.io/)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
