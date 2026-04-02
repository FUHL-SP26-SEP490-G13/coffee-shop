// Quản lý các đường dẫn điều hướng
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  STAFF: '/staff',
  BARISTA: '/barista',
  CUSTOMER: '/customer',
  ADMIN: '/admin',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  FORGOT_PASSWORD: '/forgot-password',
  PRODUCT_DETAIL: '/product/:id',
  AREAS: '/admin/area',
  PAYMENT_RESULT: '/payment-result',
};

// Quản lý API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    SEND_OTP: '/auth/send-otp',
    GOOGLE: '/auth/google',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  PRODUCTS: '/products',
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: '/users/{id}',
  },
  BANNERS: {
    ACTIVE: '/banners/active',
    ADMIN: '/banners/admin',
    ACTIVE_LIST: '/banners/active-list',
    GET_BY_ID: '/banners/admin/{id}',
  },
  DISCOUNTS: '/discounts',
  NEWS: {
    BASE: '/news',
    FEATURED: '/news/featured',
    ADMIN: '/news/admin',
    RELATED: '/news/related',
    AI_SUGGEST_BY_TITLE: '/news/ai/suggest-by-title',
    AI_SUGGEST_BY_SUMMARY: '/news/ai/suggest-by-summary',
  },
  NOTIFICATIONS: {
    MINE: '/notifications/me',
    UNREAD_COUNT: '/notifications/me/unread-count',
    MARK_AS_READ: (recipientId) => `/notifications/me/${recipientId}/read`,
    MARK_ALL_AS_READ: '/notifications/me/read-all',
    MARK_AS_UNREAD: (recipientId) => `/notifications/me/${recipientId}/unread`,
    MARK_ALL_AS_UNREAD: '/notifications/me/unread-all',
  },
  ORDERSLIST: {
    CHECKOUT: "/orders/checkout",
    MY_ORDERS: "/orders/my-orders",
    MY_ORDER_DETAIL: (id) => `/orders/my-orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    PAYOS_RETURN: "/orders/payos-return",
    VALIDATE_DISCOUNT: "/orders/validate-discount",
    PAYMENT_LINK: "/create-payment-link",
    ADMIN_LIST: "/orders/admin/list",
  },
  ORDER_ONLINE: {
    CHECKOUT: '/order-online/checkout',
    REPUTATION_BY_PHONE: (phone) => `/reputation/by-phone?phone=${encodeURIComponent(phone)}`,
    MY_ORDERS: '/order-online/my-orders',
    MY_ORDER_DETAIL: (id) => `/order-online/my-orders/${id}`,
    STAFF_ORDER_DETAIL: (id) => `/order-online/${id}/staff-detail`,
    CANCEL: (id) => `/order-online/${id}/cancel`,
    STAFF_CANCEL: (id) => `/order-online/${id}/staff-cancel`,
    CONFIRM_PREPARING: (id) => `/order-online/${id}/confirm-preparing`,
    MARK_PRINT_SUCCESS: (id) => `/order-online/${id}/print-success`,
    MARK_DELIVERING: (id) => `/order-online/${id}/mark-delivering`,
    STAFF_CANCEL_DELIVERING: (id) => `/order-online/${id}/staff-cancel-delivering`,
    STAFF_COMPLETE_DELIVERY: (id) => `/order-online/${id}/staff-complete-delivery`,
    PAYOS_RETURN: '/order-online/payos-return',
    VALIDATE_DISCOUNT: '/order-online/validate-discount',
    PAYMENT_LINK: '/create-payment-link',
  },
  PRODUCTSLIST: {
    BASE: '/products',
    BY_ID: (id) => `/products/${id}`,
    BY_CATEGORY: (categoryId) => `/products/category/${categoryId}`,
    SEARCH: '/products/search',
    BEST_SELLERS: '/products/best-sellers',
  },
  FAVORITES: {
    BASE: '/favorites',
    CHECK: (productId) => `/favorites/check/${productId}`,
    REMOVE: (productId) => `/favorites/${productId}`,
  },
  LOYALTY: {
    ME: '/loyalty/me',
    MY_TRANSACTIONS: '/loyalty/me/transactions',
  },
  ORDER_ONLINES: '/order-online',
  TOPPINGS: '/toppings',
  TOPPINGS_ADMIN: '/admin/toppings',
  AREAS: '/area',
  REVIEWS: {
    BASE: '/reviews',
    BY_PRODUCT: (productId) => `/reviews/product/${productId}`,
    MY_REVIEW: (productId) => `/reviews/me/${productId}`,
  },
  RECEIPT_SETTINGS: {
    BASE: "/receipt-settings",
    ADMIN: "/receipt-settings/admin",
  },
  TAKEAWAY: {
    ORDERS: '/takeaway/orders',
    ORDER_BY_ID: (id) => `/takeaway/orders/${id}`,
    CANCEL: (id) => `/takeaway/orders/${id}/cancel`,
    RECEIPT: (id) => `/takeaway/orders/${id}/receipt`,
    ASSIGN: (id) => `/takeaway/orders/${id}/assign`,
    SERVED: (id) => `/takeaway/orders/${id}/served`,
    COMPLETE: (id) => `/takeaway/orders/${id}/complete`,
  },
  FLASH_SALES: {
    CURRENT: '/flash-sales/current'
  },
  AI: {
    CHAT: '/ai/chat'
  },
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id) => `/categories/${id}`,
  },
  SHIFT_TEMPLATES: {
    BASE: '/shifts/templates',
    BY_ID: (id) => `/shifts/templates/${id}`,
  },
  SHIFTS: {
    ASSIGN: '/shifts/assign',
    ASSIGN_BULK: '/shifts/assign-bulk',
    REGISTRATION_BY_ID: (id) => `/shifts/registrations/${id}`,
    SCHEDULE: '/shifts/schedule',
    MY_SCHEDULE: '/shifts/schedule/me',
  },
  APP_SETTINGS: {
    BASE: '/settings',
    ADMIN: '/settings/admin'
  }
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
