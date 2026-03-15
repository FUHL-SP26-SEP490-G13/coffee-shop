// Quản lý các đường dẫn điều hướng
export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  STAFF: "/staff",
  BARISTA: "/barista",
  CUSTOMER: "/customer",
  ADMIN: "/admin",
  PROFILE: "/profile",
  CHANGE_PASSWORD: "/change-password",
  FORGOT_PASSWORD: "/forgot-password",
  PRODUCT_DETAIL: "/product/:id",
  AREAS: "/admin/area",
  PAYMENT_RESULT: "/payment-result",
};



// Quản lý API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    VERIFY_EMAIL: "/auth/verify-email",
    SEND_OTP: "/auth/send-otp",
    GOOGLE: "/auth/google",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  PRODUCTS: "/products",
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: "/users/{id}",
  },
  BANNERS: {
    ACTIVE: "/banners/active",
    ADMIN: "/banners/admin",
    ACTIVE_LIST: "/banners/active-list",
    GET_BY_ID: "/banners/admin/{id}",
  },
  DISCOUNTS: "/discounts",
  NEWS: {
    BASE: "/news",
    FEATURED: "/news/featured",
    ADMIN: "/news/admin",
    RELATED: "/news/related",
    AI_SUGGEST_BY_TITLE: "/news/ai/suggest-by-title",
    AI_SUGGEST_BY_SUMMARY: "/news/ai/suggest-by-summary",
  },
  NOTIFICATIONS: {
    MINE: "/notifications/me",
    UNREAD_COUNT: "/notifications/me/unread-count",
    MARK_AS_READ: (recipientId) => `/notifications/me/${recipientId}/read`,
    MARK_ALL_AS_READ: "/notifications/me/read-all",
    MARK_AS_UNREAD: (recipientId) => `/notifications/me/${recipientId}/unread`,
    MARK_ALL_AS_UNREAD: "/notifications/me/unread-all",
  },
  ORDERSLIST: {
    CHECKOUT: "/orders/checkout",
    MY_ORDERS: "/orders/my-orders",
    MY_ORDER_DETAIL: (id) => `/orders/my-orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    PAYOS_RETURN: "/orders/payos-return",
  },
  PRODUCTSLIST: {
    BASE: "/products",
    BY_ID: (id) => `/products/${id}`,
    BY_CATEGORY: (categoryId) => `/products/category/${categoryId}`,
    SEARCH: "/products/search",
    BEST_SELLERS: "/products/best-sellers",
  },
  FAVORITES: {
    BASE: "/favorites",
    CHECK: (productId) => `/favorites/check/${productId}`,
    REMOVE: (productId) => `/favorites/${productId}`,
  },
  ORDERS: "/orders",
  TOPPINGS: "/toppings",
  TOPPINGS_ADMIN: "/admin/toppings",
  AREAS: "/area",
};

// Các hằng số khác
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
};


export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_INDEX: 1,
};