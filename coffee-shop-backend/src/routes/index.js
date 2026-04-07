const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./auth.routes");
const categoryRoutes = require("./category.routes");
const discountRoutes = require("./discount.routes");
const productRoutes = require("./product.routes");
const newsRoutes = require("./news.routes");
const userRoutes = require("./user.routes");
const bannerRoutes = require("./banner.routes");
const { publicToppingRoutes, adminToppingRoutes } = require("./topping.routes");
const recipeRoutes = require("./recipe.routes");
const adminDBRoutes = require("./adminDB.routes");
const baristaDBRoutes = require("./baristaDB.routes");
const areaRoutes = require("./area.routes");
const tableRoutes = require("./table.routes");
const notificationRoutes = require("./notification.routes");
const ingredientRoutes = require("./ingredient.routes");
const productSizeRoutes = require("./productSize.routes");
const orderOnlineRoutes = require("./orderOnline.routes");
const reputationRoutes = require("./reputation.routes");
const orderRoutes = require("./order.routes");
const reviewRoutes = require("./review.routes");
const receiptSettingRoutes = require("./receiptSetting.routes");
const takeawayRoutes = require("./takeaway.routes");
const flashSaleRoutes = require('./flashSale.routes');
const qrOrderRoutes = require('./qrOrder.routes');
const shiftRoutes = require('./shift.routes');
const swapRequestRoutes = require('./swapRequest.routes');
const loyaltyRoutes = require('./loyalty.routes');
const aiRoutes = require('./ai.routes');
const newsletterRoutes = require('./newsletter.routes');

const CategoryRepository = require('../repositories/CategoryRepository');
const ProductRepository = require('../repositories/ProductRepository');

router.get('/public/slugs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await CategoryRepository.findBySlug(slug);
    if (category) {
      return res.json({ success: true, type: 'category', data: category });
    }

    const product = await ProductRepository.findBySlugWithDetails(slug);
    if (product) {
      return res.json({ success: true, type: 'product', data: product });
    }

    return res.status(404).json({ success: false, message: 'Không tìm thấy' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});
// Mount routes
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/news", newsRoutes);
router.use("/users", userRoutes);
router.use("/toppings", publicToppingRoutes);
router.use("/admin/toppings", adminToppingRoutes);
router.use("/recipes", recipeRoutes);
router.use("/area", areaRoutes);
router.use("/tables", tableRoutes);
router.use("/admin/recipes", recipeRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/product-sizes", productSizeRoutes);
router.use("/dashboard", adminDBRoutes);
router.use("/barista", baristaDBRoutes);
router.use("/banners", bannerRoutes);
router.use("/notifications", notificationRoutes);
router.use("/discounts", discountRoutes);
router.use("/order-online", orderOnlineRoutes);
router.use("/reputation", reputationRoutes);
router.use("/reviews", reviewRoutes);
router.use("/receipt-settings", receiptSettingRoutes);
router.use("/takeaway", takeawayRoutes);
router.use("/orders", orderRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/qr-order', qrOrderRoutes);
router.use('/shifts', shiftRoutes);
router.use('/swap-requests', swapRequestRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/ai', aiRoutes);
router.use('/newsletters', newsletterRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Coffee Shop Management API",
    version: "1.0.0",
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
        getAddresses: 'GET /api/auth/address',
        createAddress: 'POST /api/auth/address',
        updateAddress: 'PUT /api/auth/address/:id',
        deleteAddress: 'DELETE /api/auth/address/:id',
        setDefaultAddress: 'PATCH /api/auth/address/:id/default',
      },
      categories: {
        getAll: "GET /api/categories",
        getById: "GET /api/categories/:id",
        search: "GET /api/categories/search",
        create: "POST /api/categories (Admin)",
        update: "PUT /api/categories/:id (Admin)",
        delete: "DELETE /api/categories/:id (Admin)",
        restore: "POST /api/categories/:id/restore (Admin)",
      },
      users: {
        getAll: "GET /api/users (Admin)",
        getById: "GET /api/users/:id (Admin)",
        search: "GET /api/users/search (Admin)",
        getByRole: "GET /api/users/role/:roleId (Admin)",
        getStaff: "GET /api/users/staff (Admin)",
        getCustomers: "GET /api/users/customers (Admin)",
        getStats: "GET /api/users/stats (Admin)",
        create: "POST /api/users (Admin)",
        update: "PUT /api/users/:id (Admin)",
        deactivate: "POST /api/users/:id/deactivate (Admin)",
        activate: "POST /api/users/:id/activate (Admin)",
        delete: "DELETE /api/users/:id (Admin)",
      },
      toppings: {
        getAll: "GET /api/toppings",
        getById: "GET /api/toppings/:id",
        search: "GET /api/toppings/search",
        create: "POST /api/admin/toppings (Admin)",
        update: "PUT /api/admin/toppings/:id (Admin)",
        delete: "DELETE /api/admin/toppings/:id (Admin)",
        restore: "POST /api/admin/toppings/:id/restore (Admin)",
      },
      recipes: {
        getByProductSize: "GET /api/recipes/by-size/:productSizeId (Admin)",
        getByProductGrouped:
          "GET /api/recipes/product/:productId/by-size (Admin)",
        getByProduct: "GET /api/recipes/product/:productId (Admin)",
        getById: "GET /api/recipes/:id (Admin)",
        create: "POST /api/recipes/by-size/:productSizeId (Admin/Barista)",
        update: "PUT /api/recipes/by-size/:productSizeId (Admin/Barista)",
        delete: "DELETE /api/recipes/:id (Admin/Barista)",
      },
      ingredients: {
        getAll: "GET /api/ingredients (Admin)",
        getById: "GET /api/ingredients/:id (Admin)",
        search: "GET /api/ingredients/search (Admin)",
        create: "POST /api/ingredients (Admin)",
        update: "PUT /api/ingredients/:id (Admin)",
        delete: "DELETE /api/ingredients/:id (Admin)",
      },
      baristaDashboard: {
        overview: "GET /api/barista/dashboard",
        trends: "GET /api/barista/dashboard/trends?hours=6",
      },
      discounts: {
        getAll: "GET /api/discounts?page=1&limit=10&code=&status= (Manager)",
        /*
        - http://localhost:5000/api/discounts
        - http://localhost:5000/api/discounts?page=1&limit=10
        - http://localhost:5000/api/discounts?page=1&limit=10&code=WELCOME10&status=active
        */
        getById: "GET /api/discounts/:id (Manager)",
        /*  
        - http://localhost:5000/api/discounts/{id}
        */
        create: "POST /api/discounts (Manager)",
        /*
        - http://localhost:5000/api/discounts
        {
          "code": "SUMMER2026",
          "description": "Giảm giá mùa hè",
          "percentage": 10,
          "min_order_amount": 100000,
          "max_discount_amount": 50000,
          "usage_limit": 100,
          "valid_from": "2026-06-01T00:00:00",
          "valid_until": "2026-06-30T23:59:59"
        }
          thiếu 1 số trường
        */
        update: "PUT /api/discounts/:id (Manager)",
        /*
        - http://localhost:5000/api/discounts/{id}
        {
        "description": "Giảm giá mùa hè cập nhật",
        "percentage": 15
        }
        */
        delete: "DELETE /api/discounts/:id (Manager)",
        /*
        - http://localhost:3000/api/discounts/{id} 
        */
      },
      news: {
        getAll: "GET /api/news?page=1&limit=6",
        /*
        - http://localhost:5000/api/news
        - http://localhost:5000/api/news?page=1&limit=5
        */
        getDetail: "GET /api/news/:slug",
        /*
        - http://localhost:5000/api/news/chill-he-cung-coffee
        */
        getFeatured: "GET /api/news/featured",
        /*
        - http://localhost:5000/api/news/featured
        */
        getRelated: "GET /api/news/related?tag=&excludeId=",
        /*
        - http://localhost:5000/api/news/related?tag=Tips&excludeId=
        */
        create: "POST /api/news (Manager, multipart/form-data)",
        /*
        - http://localhost:5000/api/news
        đổi const news = await NewsService.createNews(data, req.user.id);
        thành const news = await NewsService.createNews(data, 1);
        {
        "title": "Khuyến mãi cà phê mùa hè",
        "summary": "Ưu đãi đặc biệt dành cho khách hàng trong tháng này.",
        "content": "<p>Chào mừng mùa hè với chương trình khuyến mãi đặc biệt tại Coffee Shop.</p><h2>Ưu đãi hấp dẫn</h2><ul><li>Giảm 20% cho mọi loại cà phê</li><li>Tặng bánh miễn phí cho hóa đơn trên 100k</li></ul><h2>Thời gian áp dụng</h2><p>Từ ngày 1/6 đến 30/6</p>",
        "tag": "#khuyenmai",
        "thumbnail": "https://picsum.photos/seed/coffee10/600/400"
        }
        thiếu slug, views, ... -> mỗi thêm trường nào thì thêm
        */
        getAllAdmin: "GET /api/news/admin?page=1&limit=10&keyword= (Manager)",
        /*
        http://localhost:5000/api/news/admin?page=1&limit=10
        http://localhost:5000/api/news/admin?page=1&limit=10&keyword=coffee
        */
        getById: "GET /api/news/admin/:id (Manager)",
        /*
        http://localhost:5000/api/news/admin/2
        */
        update: "PUT /api/news/:id (Manager, multipart/form-data)",
        /*
      - http://localhost:5000/api/news/63
        {
        "title": "Khuyến mãi cà phê mùa hè CẬP NHẬT",
        "summary": "Ưu đãi đặc biệt dành cho khách hàng trong tháng này CẬP NHẬT",
        "content": "<p>NỘI DUNG CẬP NHẬT Chào mừng mùa hè với chương trình khuyến mãi đặc biệt tại Coffee Shop. Ưu đãi hấp dẫn</p>NỘI DUNG CẬP NHẬT Chào mừng mùa hè với chương trình khuyến mãi đặc biệt tại Coffee Shop. Ưu đãi hấp dẫn",
        "tag": "#capnhat",
        "thumbnail": "https://picsum.photos/seed/coffee10/600/400"
        thiếu slug, views, ... -> mỗi thêm trường nào thì thêm
        }
        */
        delete: "DELETE /api/news/:id (Manager)",
        /*
        http://localhost:5000/api/news/63
        */
        aiSuggestByTitle: "POST /api/news/ai/suggest-by-title (Manager)",
        /*
        http://localhost:5000/api/news/ai/suggest-by-title
        {
        "title": "Khuyến mãi cà phê mùa hè dành cho khách hàng thân thiết"
        }
        -> xong AI sẽ gợi ý tag, summary, content
        */
        aiSuggestBySummary: "POST /api/news/ai/suggest-by-summary (Manager)",
        /*
      - http://localhost:5000/api/news/ai/suggest-by-summary
        {
        "title": "Khuyến mãi cà phê mùa hè dành cho khách hàng thân thiết",
        "summary": "Chương trình ưu đãi dành cho khách hàng yêu thích cà phê trong mùa hè này."
        }
        */
      },
      banners: {
        getActive: "GET /api/banners/active",
        /*
        http://localhost:5000/api/banners/active
        */
        getActiveList: "GET /api/banners/active-list",
        /*
        http://localhost:5000/api/banners/active-list
        */
        getAllAdmin:
          "GET /api/banners/admin?page=1&limit=5&keyword=&status= (Manager)",
        /*
        http://localhost:5000/api/banners/admin
        http://localhost:5000/api/banners/admin?page=1&limit=5
        http://localhost:5000/api/banners/admin?page=1&limit=5&keyword=khuyen mai
        http://localhost:5000/api/banners/admin?page=1&limit=5&status=active
        http://localhost:5000/api/banners/admin?page=1&limit=5&keyword=khuyen mai&status=active
        */
        create: "POST /api/banners/admin (Manager, multipart/form-data)",
        /*
        http://localhost:5000/api/banners/admin
        {
        "title": "Khuyến mãi mùa hè",
        "subtitle": "Giảm giá đồ uống cho khách hàng trong tháng này",
        "button_text": "Xem ngay",
        "button_link": "/products",
        "start_date": "2026-06-01T00:00",
        "end_date": "2026-06-30T23:59",
        "type": "banner",
        "image_url": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0"
        }
        -> sửa bannerBaseSchema back end: type: Joi.string().allow("", null),
                                          image_url: Joi.string().uri().allow("", null),
        */
        update: "PUT /api/banners/admin/:id (Manager, multipart/form-data)",
        /*
        http://localhost:5000/api/banners/admin/59
        {
        "title": "Khuyến mãi mùa hè cập nhật",
        "subtitle": "Giảm giá đồ uống cho khách hàng trong tháng này cập nhật",
        "button_text": "Mua ngay",
        "button_link": "/products/10",
        "start_date": "2026-07-01T00:00",
        "end_date": "2026-07-30T23:59",
        "type": "banner",
        "image_url": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0"
        }
        */
        delete: "DELETE /api/banners/admin/:id (Manager)",
        /*
        http://localhost:5000/api/banners/admin/59
        */
      },
      "order-online": {
        checkout: "POST /api/order-online/checkout",
        /*
        http://localhost:5000/api/order-online/checkout
        takeaway
        {
        "order_type": "takeaway",
        "payment_method": "cash",
        "receiver_name": "Trần Thị B",
        "receiver_phone": "0912345678",
        "receiver_email": "tranb@gmail.com",
        "address": "",
        "note": "Tôi sẽ tự đến lấy",
        "items": [
          {
            "product_size_id": 2,
            "quantity": 1,
            "toppings": [
                {
                  "topping_id": 1,
                  "quantity": 1
                }
              ]
            }
          ]
        }
        */
        getMyOrders: "GET /api/order-online/my-orders (Authenticated)",
        /*
        http://localhost:5000/api/order-online/my-orders
        LẤY TOKEN: http://localhost:5000/api/auth/login
          {
            "identifier": "admin@gmail.com",
            "password": "admin123"
          }
            -> sẽ lấy đơn hàng thành công
        */
        getMyOrderDetail: "GET /api/order-online/my-orders/:id (Authenticated)",
        /*
        http://localhost:5000/api/order-online/my-orders/35
        login cus: {
          "identifier": "cus1@gmail.com",
          "password": "admin123"
          }

        */
        payosReturn: "POST /api/order-online/payos-return",
        /*
        http://localhost:5000/api/order-online/payos-return
        {
        "orderCode": "123456",
        "payosId": "PAYOS_ABC_999",
        "status": "PAID"
        }
        */
      },
      reviews: {
        getByProduct: "GET /api/reviews/product/:productId",
        /*
        http://localhost:5000/api/reviews/product/12
        -> Lấy danh sách đánh giá của sản phẩm
        */

        getMyReview: "GET /api/reviews/me/:productId (Authenticated)",
        /*
        http://localhost:5000/api/reviews/me/1

        Lấy review của chính user cho sản phẩm.

        Cần token:
        http://localhost:5000/api/auth/login
        {
        "identifier": "cus1@gmail.com",
        "password": "admin123"
        }
        */
        createOrUpdate: "POST /api/reviews (Authenticated)",
        /*
        http://localhost:5000/api/reviews

        {
          "product_id": 1,
          "rating": 5,
          "comment": "Cà phê rất ngon"
        }

        - Nếu chưa review -> tạo mới
        - Nếu đã review -> update
        - Chỉ review được sản phẩm đã mua
        */

        getAllAdmin: "GET /api/reviews?page=1&limit=7&keyword= (Authenticated)",
        /*
        http://localhost:5000/api/reviews
        http://localhost:5000/api/reviews?page=1&limit=7
        http://localhost:5000/api/reviews?page=1&limit=7&keyword=coffee

        -> Lấy danh sách tất cả review (admin quản lý)
        -> Search theo:
          - tên sản phẩm
          - tên người dùng
          - comment
          - rating
        */
      },
    },
  });
});

module.exports = router;
