# Ví dụ kết quả khi chạy Test

## Cách chạy test với output chi tiết

```bash
npm test -- --verbose
```

## Ví dụ Output khi test thành công

```
PASS  __tests__/services/AuthService.test.js
  AuthService - Login
    login
      ✓ TC-1: should login successfully with email (XX ms)

==================================================
🧪 TC-1: Đăng nhập thành công với email
==================================================

📝 INPUT: {
  "identifier": "test@example.com",
  "password": "Password123!"
}
✅ OUTPUT EXPECT: {
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role_id": 1,
    "role_name": "Customer",
    "isActive": true
  },
  "token": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
🎯 OUTPUT REALITY: {
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role_id": 1,
    "role_name": "Customer",
    "isActive": true
  },
  "token": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}

      ✓ TC-2: should login successfully with username (XX ms)

==================================================
🧪 TC-2: Đăng nhập thành công với username
==================================================

📝 INPUT: {
  "identifier": "testuser",
  "password": "Password123!"
}
✅ OUTPUT EXPECT: {
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role_id": 1,
    "role_name": "Customer",
    "isActive": true
  },
  "token": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
🎯 OUTPUT REALITY: {
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role_id": 1,
    "role_name": "Customer",
    "isActive": true
  },
  "token": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
```

## Ví dụ Output khi test với Error

```
      ✓ TC-3: should throw error when user not found (XX ms)

==================================================
🧪 TC-3: Lỗi khi không tìm thấy user
==================================================

📝 INPUT: {
  "identifier": "nonexistent@example.com",
  "password": "Password123!"
}
✅ OUTPUT EXPECT: Error - Email/Username hoặc mật khẩu không đúng
🎯 OUTPUT REALITY: Error - Email/Username hoặc mật khẩu không đúng

      ✓ TC-4: should throw error when user is not active (XX ms)

==================================================
🧪 TC-4: Lỗi khi tài khoản không active
==================================================

📝 INPUT: {
  "identifier": "test@example.com",
  "password": "Password123!"
}
✅ OUTPUT EXPECT: Error - Tài khoản đã bị vô hiệu hóa
🎯 OUTPUT REALITY: Error - Tài khoản đã bị vô hiệu hóa

      ✓ TC-5: should throw error when password is incorrect (XX ms)

==================================================
🧪 TC-5: Lỗi khi mật khẩu không đúng
==================================================

📝 INPUT: {
  "identifier": "test@example.com",
  "password": "WrongPassword123!"
}
✅ OUTPUT EXPECT: Error - Email/Username hoặc mật khẩu không đúng
🎯 OUTPUT REALITY: Error - Email/Username hoặc mật khẩu không đúng
```

## Controller Tests

```
PASS  __tests__/controllers/AuthController.test.js
  AuthController - Login
    login
      ✓ TC-1: should login successfully with valid credentials (XX ms)

==================================================
🧪 TC-1: Controller xử lý login thành công
==================================================

📝 INPUT: {
  "identifier": "test@example.com",
  "password": "Password123!"
}
✅ OUTPUT EXPECT: {
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role_id": 1
  },
  "token": "mock-access-token",
  "refreshToken": "mock-refresh-token"
}
🎯 OUTPUT REALITY: response.success called with result
```

## Test Summary

```
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        X.XXXs
Ran all test suites.
```

## Test Cases Tổng hợp

### AuthService.test.js (7 test cases)
- **TC-1:** Đăng nhập thành công với email
- **TC-2:** Đăng nhập thành công với username
- **TC-3:** Lỗi khi không tìm thấy user
- **TC-4:** Lỗi khi tài khoản không active
- **TC-5:** Lỗi khi mật khẩu không đúng
- **TC-6:** Tạo token đúng format với user data
- **TC-7:** Không trả về password trong response

### AuthController.test.js (6 test cases)
- **TC-1:** Controller xử lý login thành công
- **TC-2:** Controller xử lý login với username
- **TC-3:** Controller xử lý lỗi login
- **TC-4:** Controller xử lý lỗi tài khoản không active
- **TC-5:** Controller xử lý lỗi user không tồn tại
- **TC-6:** Controller xử lý lỗi hệ thống

## Lợi ích của format mới

### 1. Dễ Debug
- Mã test case (TC-1, TC-2...) giúp dễ tham chiếu
- Đường phân cách rõ ràng giữa các test
- Nhìn ngay được INPUT đang test
- So sánh EXPECT vs REALITY dễ dàng
- Phát hiện lỗi nhanh chóng

### 2. Tài liệu rõ ràng
- Mỗi test case có mã số riêng
- Mỗi test case là một ví dụ sử dụng
- Hiểu được flow của function
- Biết được các trường hợp edge case

### 3. Maintenance tốt hơn
- Dễ tham chiếu khi báo lỗi (ví dụ: "TC-3 failed")
- Người khác đọc code dễ hiểu
- Cập nhật test dễ dàng
- Review code hiệu quả

## Chạy test cụ thể với output

```bash
# Chạy một test file
npm test AuthService.test.js

# Chạy test với pattern
npm test -- --testNamePattern="TC-1"

# Chạy tất cả test cases liên quan đến error
npm test -- --testNamePattern="error"

# Chạy test với coverage
npm test -- --coverage --verbose
```

## Tips

- Sử dụng mã TC (TC-1, TC-2...) khi báo cáo lỗi hoặc thảo luận
- Format JSON giúp dễ đọc: `JSON.stringify(data, null, 2)`
- Icon giúp phân biệt:
  - 🧪 Mã test case
  - 📝 INPUT (dữ liệu đầu vào)
  - ✅ OUTPUT EXPECT (kết quả mong đợi)
  - 🎯 OUTPUT REALITY (kết quả thực tế)
- Đường phân cách `=`.repeat(50) giúp dễ đọc giữa các test

## Tham chiếu nhanh Test Cases

Khi cần test một tính năng cụ thể, tham khảo:
- **Login thành công:** TC-1, TC-2
- **Xác thực lỗi:** TC-3, TC-4, TC-5
- **Security:** TC-7 (password không bị leak)
- **Token generation:** TC-6
