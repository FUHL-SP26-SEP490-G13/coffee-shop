const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const discountRoutes = require('./discount.routes');
const productRoutes = require('./product.routes');
const newsRoutes = require('./news.routes');
const newsLetterRoutes = require('./newsletter.routes');
const userRoutes = require('./user.routes');
const bannerRoutes = require('./banner.routes');
const { publicToppingRoutes, adminToppingRoutes } = require('./topping.routes');
const adminDashboardRoutes = require('./adminDashboard.routes');
const recipeRoutes = require('./recipe.routes');
const areaRoutes = require("./area.routes");
const tableRoutes = require("./table.routes");
const notificationRoutes = require("./notification.routes");
const ingredientRoutes = require('./ingredient.routes');
const productSizeRoutes = require('./productSize.routes');
const orderRoutes = require("./order.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/news-letter", newsLetterRoutes);
router.use('/news', newsRoutes);
router.use('/users', userRoutes);
router.use('/toppings', publicToppingRoutes);
router.use('/admin/toppings', adminToppingRoutes);
router.use('/recipes', recipeRoutes);
router.use("/area", areaRoutes);
router.use("/tables", tableRoutes);
router.use('/admin/recipes', recipeRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/product-sizes', productSizeRoutes);
router.use('/dashboard', adminDashboardRoutes);
router.use('/banners', bannerRoutes);
router.use("/notifications", notificationRoutes);
router.use("/discounts", discountRoutes);
router.use("/orders", orderRoutes);

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
      toppings: {
        getAll: 'GET /api/toppings',
        getById: 'GET /api/toppings/:id',
        search: 'GET /api/toppings/search',
        create: 'POST /api/admin/toppings (Admin)',
        update: 'PUT /api/admin/toppings/:id (Admin)',
        delete: 'DELETE /api/admin/toppings/:id (Admin)',
        restore: 'POST /api/admin/toppings/:id/restore (Admin)',
      },
      recipes: {
        getByProductSize: 'GET /api/recipes/by-size/:productSizeId (Admin)',
        getByProductGrouped: 'GET /api/recipes/product/:productId/by-size (Admin)',
        getByProduct: 'GET /api/recipes/product/:productId (Admin)',
        getById: 'GET /api/recipes/:id (Admin)',
        create: 'POST /api/recipes/by-size/:productSizeId (Admin/Barista)',
        update: 'PUT /api/recipes/by-size/:productSizeId (Admin/Barista)',
        delete: 'DELETE /api/recipes/:id (Admin/Barista)',
      },
      ingredients: {
        getAll: 'GET /api/ingredients (Admin)',
        getById: 'GET /api/ingredients/:id (Admin)',
        search: 'GET /api/ingredients/search (Admin)',
        create: 'POST /api/ingredients (Admin)',
        update: 'PUT /api/ingredients/:id (Admin)',
        delete: 'DELETE /api/ingredients/:id (Admin)',
      },
    },
  });
});

module.exports = router;
