module.exports = {
  // User Roles
  ROLES: {
    MANAGER: 1,
    STAFF: 2,
    BARISTA: 3,
    CUSTOMER: 4,
  },

  ROLES_STRING: {
    MANAGER: "manager",
    STAFF: "staff",
    BARISTA: "barista",
    CUSTOMER: "customer",
  },

  ROLE_NAMES: {
    1: "manager",
    2: "staff",
    3: "barista",
    4: "customer",
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: "pending",
    PREPARING: "preparing",
    SERVED: "served",
    DELIVERING: "delivering",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },

  // Order Types
  ORDER_TYPES: {
    DINE_IN: "dine-in",
    TAKEAWAY: "takeaway",
    DELIVERY: "delivery",
  },

  // Product Status
  PRODUCT_STATUS: {
    AVAILABLE: "available",
    OUT_OF_STOCK: "out_of_stock",
    DISCONTINUED: "discontinued",
  },

  // Product Sizes
  SIZES: {
    SMALL: "S",
    MEDIUM: "M",
    LARGE: "L",
  },

  // Table Status
  TABLE_STATUS: {
    AVAILABLE: "available",
    OCCUPIED: "occupied",
    RESERVED: "reserved",
  },

  // Address Types
  ADDRESS_TYPES: {
    HOME: "home",
    WORK: "work",
    OTHER: "other",
  },

  // Shift Status
  SHIFT_STATUS: {
    REGISTERED: "registered",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
  },

  // Attendance Status (check-in)
  ATTENDANCE_STATUS: {
    PRESENT: "present",
    LATE: "late",
    ABSENT: "absent",
  },

  // Attendance Checkout Status (check-out)
  ATTENDANCE_CHECKOUT_STATUS: {
    ON_TIME: "on_time",
    EARLY: "early",
    MISSING: "missing",
  },

  // Leave Request Status
  LEAVE_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: "cash",
    CARD: "card",
    BANKING: "banking",
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: "pending",
    PAID: "paid",
    REFUNDED: "refunded",
  },
};
