// Quản lý các đường dẫn điều hướng
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  STAFF: '/staff',
  BARISTA: '/barista',
  ADMIN: '/admin',
  PROFILE: '/profile',
  PRODUCT_DETAIL: '/product/:id',
};

// Quản lý API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  PRODUCTS: '/products',
  USERS: '/users',
};

// Các hằng số khác
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ROLE_ID: 'role_id',
};


export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_INDEX: 1,
};