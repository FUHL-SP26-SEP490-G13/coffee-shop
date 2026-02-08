module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 1,
    STAFF: 2,
    BARISTA: 3,
    CUSTOMER: 4,
  },

  ROLE_NAMES: {
    1: 'admin',
    2: 'staff',
    3: 'barista',
    4: 'customer',
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    SERVED: 'served',
    DELIVERING: 'delivering',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Order Types
  ORDER_TYPES: {
    DINE_IN: 'dine-in',
    TAKEAWAY: 'takeaway',
    DELIVERY: 'delivery',
  },

  // Product Status
  PRODUCT_STATUS: {
    AVAILABLE: 'available',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
  },

  // Product Sizes
  SIZES: {
    SMALL: 'S',
    MEDIUM: 'M',
    LARGE: 'L',
  },

  // Table Status
  TABLE_STATUS: {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    RESERVED: 'reserved',
  },

  // Address Types
  ADDRESS_TYPES: {
    HOME: 'home',
    WORK: 'work',
    OTHER: 'other',
  },

  // Shift Status
  SHIFT_STATUS: {
    REGISTERED: 'registered',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    LEAVE: 'leave',
  },

  // Leave Request Status
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    MOMO: 'momo',
    BANKING: 'banking',
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    REFUNDED: 'refunded',
  },
};
