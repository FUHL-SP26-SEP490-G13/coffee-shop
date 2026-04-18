# Coffee Shop Management System - Backend

Backend API cho hệ thống quản lý quán cà phê, xây dựng bằng Node.js, Express và MySQL.

## 📋 Yêu cầu

- Node.js >= 16.x
- MySQL >= 8.0
- npm hoặc yarn

## 🚀 Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd coffee-shop-backend
npm install
```

### 2. Tạo database

Chạy file SQL schema trong thư mục `database/`:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật thông tin trong file `.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=coffeeshopmanagement
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CLIENT_URL=http://localhost:3000
```

### 4. Khởi chạy server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

Truy cập `http://localhost:5000/api` để xem danh sách endpoints.

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "phone": "0912345678",
  "username": "johndoe",
  "password": "password123",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-01-01"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "0987654321"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Category Endpoints

#### Get All Categories
```http
GET /api/categories
GET /api/categories?with_count=true
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Search Categories
```http
GET /api/categories/search?keyword=cafe&limit=20
```

#### Create Category (Admin only)
```http
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Cà phê"
}
```

#### Update Category (Admin only)
```http
PUT /api/categories/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Cà phê Đặc Biệt"
}
```

#### Delete Category (Admin only)
```http
DELETE /api/categories/:id
Authorization: Bearer <admin_token>
```

### User Management Endpoints (Admin only)

#### Get All Users
```http
GET /api/users
Authorization: Bearer <admin_token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin_token>
```

#### Search Users
```http
GET /api/users/search?keyword=john
Authorization: Bearer <admin_token>
```

#### Get Users by Role
```http
GET /api/users/role/:roleId
Authorization: Bearer <admin_token>
```

#### Get All Staff
```http
GET /api/users/staff
Authorization: Bearer <admin_token>
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <admin_token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "phone": "0912345678",
  "username": "staffuser",
  "password": "password123",
  "email": "staff@example.com",
  "first_name": "Staff",
  "last_name": "User",
  "dob": "1995-01-01",
  "role_id": 2
}
```

## 🔐 Roles

- `1` - Admin
- `2` - Staff (Nhân viên)
- `3` - Barista
- `4` - Customer (Khách hàng)

## 📁 Cấu trúc thư mục

```
coffee-shop-backend/
├── src/
│   ├── config/          # Database, env, constants
│   ├── repositories/    # Database queries
│   ├── services/        # Business logic
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validate, error handler
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── validators/      # Joi schemas
│   └── app.js          # Express app setup
├── database/           # SQL schema
├── .env               # Environment variables
├── .env.example       # Environment template
├── package.json
└── server.js          # Entry point
```

## 🛠️ Technologies

- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **Joi** - Validation
- **Bcryptjs** - Password hashing
- **Winston** - Logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Input validation with Joi
- SQL injection protection
- CORS configuration

## 📊 Logging

Logs được lưu trong thư mục `logs/`:
- `combined.log` - Tất cả logs
- `error.log` - Chỉ errors

## 🧪 Testing

```bash
npm test
```

## 📄 License

ISC
