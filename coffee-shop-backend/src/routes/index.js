const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const userRoutes = require('./user.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Coffee Shop Management API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'POST /api/auth/change-password',
        refreshToken: 'POST /api/auth/refresh-token',
        resetPassword: 'POST /api/auth/reset-password',
        logout: 'POST /api/auth/logout',
      },
      categories: {
        getAll: 'GET /api/categories',
        getById: 'GET /api/categories/:id',
        search: 'GET /api/categories/search',
        create: 'POST /api/categories (Admin)',
        update: 'PUT /api/categories/:id (Admin)',
        delete: 'DELETE /api/categories/:id (Admin)',
        restore: 'POST /api/categories/:id/restore (Admin)',
      },
      users: {
        getAll: 'GET /api/users (Admin)',
        getById: 'GET /api/users/:id (Admin)',
        search: 'GET /api/users/search (Admin)',
        getByRole: 'GET /api/users/role/:roleId (Admin)',
        getStaff: 'GET /api/users/staff (Admin)',
        getCustomers: 'GET /api/users/customers (Admin)',
        getStats: 'GET /api/users/stats (Admin)',
        create: 'POST /api/users (Admin)',
        update: 'PUT /api/users/:id (Admin)',
        deactivate: 'POST /api/users/:id/deactivate (Admin)',
        activate: 'POST /api/users/:id/activate (Admin)',
        delete: 'DELETE /api/users/:id (Admin)',
      },
    },
  });
});

module.exports = router;
