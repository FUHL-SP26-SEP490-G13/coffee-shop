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
  ORDERS: '/orders',
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