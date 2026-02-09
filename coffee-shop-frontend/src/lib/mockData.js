// Mock Data for Coffee Shop Management System

export const categories = [
  { id: '1', name: 'All', icon: 'Coffee' },
  { id: '2', name: 'Coffee', icon: 'Coffee' },
  { id: '3', name: 'Tea', icon: 'LeafyGreen' },
  { id: '4', name: 'Smoothie', icon: 'Grape' },
  { id: '5', name: 'Pastry', icon: 'Cookie' },
];

export const toppings = [
  { id: '1', name: 'Extra Shot', price: 1.5 },
  { id: '2', name: 'Whipped Cream', price: 0.5 },
  { id: '3', name: 'Caramel Drizzle', price: 0.75 },
  { id: '4', name: 'Vanilla Syrup', price: 0.5 },
  { id: '5', name: 'Hazelnut Syrup', price: 0.5 },
  { id: '6', name: 'Almond Milk', price: 0.75 },
  { id: '7', name: 'Oat Milk', price: 0.75 },
  { id: '8', name: 'Chocolate Powder', price: 0.5 },
];

export const products = [
  {
    id: '1',
    name: 'Espresso',
    description: 'Rich and bold espresso shot',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1705952285570-113e76f63fb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBlc3ByZXNzb3xlbnwxfHx8fDE3NzAzMjgwOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 2.5, M: 3.0, L: 3.5 },
    available: true,
  },
  {
    id: '2',
    name: 'Cappuccino',
    description: 'Classic Italian coffee with steamed milk foam',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1708430651927-20e2e1f1e8f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXBwdWNjaW5vJTIwY29mZmVlfGVufDF8fHx8MTc3MDM5MjUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 3.5, M: 4.0, L: 4.5 },
    available: true,
  },
  {
    id: '3',
    name: 'Latte',
    description: 'Smooth espresso with steamed milk',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1669162364316-a74b2d661d1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXR0ZSUyMGNvZmZlZSUyMGFydHxlbnwxfHx8fDE3NzAzOTI3Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 3.5, M: 4.0, L: 4.5 },
    available: true,
  },
  {
    id: '4',
    name: 'Americano',
    description: 'Espresso diluted with hot water',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1669872484166-e11b9638b50e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbm8lMjBjb2ZmZWV8ZW58MXx8fHwxNzcwMzYxNDUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 2.5, M: 3.0, L: 3.5 },
    available: true,
  },
  {
    id: '5',
    name: 'Mocha',
    description: 'Chocolate-flavored variant of latte',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1619286310410-a95de97b0aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2NoYSUyMGNvZmZlZSUyMGNob2NvbGF0ZXxlbnwxfHx8fDE3NzAzNjEyNzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 4.0, M: 4.5, L: 5.0 },
    available: true,
  },
  {
    id: '6',
    name: 'Caramel Macchiato',
    description: 'Espresso with vanilla and caramel',
    categoryId: '2',
    image: 'https://images.unsplash.com/photo-1662047102608-a6f2e492411f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJhbWVsJTIwbWFjY2hpYXRvfGVufDF8fHx8MTc3MDI5MDM2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 4.5, M: 5.0, L: 5.5 },
    available: true,
  },
  {
    id: '7',
    name: 'Green Tea Latte',
    description: 'Matcha green tea with steamed milk',
    categoryId: '3',
    image: 'https://images.unsplash.com/photo-1708572727896-117b5ea25a86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXRjaGElMjBncmVlbiUyMHRlYSUyMGxhdHRlfGVufDF8fHx8MTc3MDM0NzY2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 4.0, M: 4.5, L: 5.0 },
    available: true,
  },
  {
    id: '8',
    name: 'Earl Grey Tea',
    description: 'Classic black tea with bergamot',
    categoryId: '3',
    image: 'https://images.unsplash.com/photo-1498604636225-6b87a314baa0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJsJTIwZ3JleSUyMHRlYXxlbnwxfHx8fDE3NzAzOTI3ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 2.5, M: 3.0, L: 3.5 },
    available: true,
  },
  {
    id: '9',
    name: 'Mango Smoothie',
    description: 'Fresh mango blended smoothie',
    categoryId: '4',
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5nbyUyMHNtb290aGllfGVufDF8fHx8MTc3MDM5Mjc4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 4.5, M: 5.0, L: 5.5 },
    available: true,
  },
  {
    id: '10',
    name: 'Berry Smoothie',
    description: 'Mixed berries smoothie bowl',
    categoryId: '4',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXJyeSUyMHNtb290aGllfGVufDF8fHx8MTc3MDM4OTczOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 4.5, M: 5.0, L: 5.5 },
    available: true,
  },
  {
    id: '11',
    name: 'Croissant',
    description: 'Buttery flaky French pastry',
    categoryId: '5',
    image: 'https://images.unsplash.com/photo-1618667060775-1fe102237f94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9pc3NhbnQlMjBwYXN0cnl8ZW58MXx8fHwxNzcwMzQ5MTk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 3.0, M: 3.0, L: 3.0 },
    available: true,
  },
  {
    id: '12',
    name: 'Chocolate Muffin',
    description: 'Rich chocolate chip muffin',
    categoryId: '5',
    image: 'https://images.unsplash.com/photo-1611614010348-7df489604fe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBtdWZmaW58ZW58MXx8fHwxNzcwMzkyNzgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    prices: { S: 3.5, M: 3.5, L: 3.5 },
    available: true,
  },
];

export const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer',
    phone: '+1234567890',
    points: 450,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'staff',
    phone: '+1234567891',
    points: 0,
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'staff',
    phone: '+1234567892',
    points: 0,
  },
  {
    id: '4',
    name: 'Admin User',
    email: 'admin@coffeeshop.com',
    role: 'admin',
    phone: '+1234567893',
    points: 0,
  },
];

export const addresses = [
  {
    id: '1',
    userId: '1',
    label: 'Home',
    street: '123 Main St, Apt 4B',
    city: 'New York, NY 10001',
    isDefault: true,
  },
  {
    id: '2',
    userId: '1',
    label: 'Office',
    street: '456 Business Ave, Floor 12',
    city: 'New York, NY 10002',
    isDefault: false,
  },
];

export const tables = [
  { id: '1', number: 1, capacity: 2, status: 'available' },
  { id: '2', number: 2, capacity: 2, status: 'occupied', currentOrderId: '1' },
  { id: '3', number: 3, capacity: 4, status: 'available' },
  { id: '4', number: 4, capacity: 4, status: 'reserved' },
  { id: '5', number: 5, capacity: 6, status: 'available' },
  { id: '6', number: 6, capacity: 2, status: 'occupied', currentOrderId: '2' },
  { id: '7', number: 7, capacity: 4, status: 'available' },
  { id: '8', number: 8, capacity: 2, status: 'available' },
];

export const orders = [
  {
    id: '1',
    userId: '1',
    items: [
      {
        id: 'i1',
        productId: '2',
        product: products[1],
        size: 'M',
        quantity: 2,
        toppings: [toppings[0]],
      },
      {
        id: 'i2',
        productId: '11',
        product: products[10],
        size: 'S',
        quantity: 1,
        toppings: [],
      },
    ],
    type: 'dine-in',
    status: 'preparing',
    tableNumber: 2,
    subtotal: 11.0,
    tax: 1.1,
    deliveryFee: 0,
    total: 12.1,
    createdAt: '2026-02-06T09:30:00Z',
    updatedAt: '2026-02-06T09:35:00Z',
  },
  {
    id: '2',
    userId: '1',
    items: [
      {
        id: 'i3',
        productId: '3',
        product: products[2],
        size: 'L',
        quantity: 1,
        toppings: [toppings[5], toppings[2]],
      },
    ],
    type: 'takeaway',
    status: 'ready',
    subtotal: 6.0,
    tax: 0.6,
    deliveryFee: 0,
    total: 6.6,
    createdAt: '2026-02-06T10:00:00Z',
    updatedAt: '2026-02-06T10:15:00Z',
  },
  {
    id: '3',
    userId: '1',
    items: [
      {
        id: 'i4',
        productId: '5',
        product: products[4],
        size: 'M',
        quantity: 2,
        toppings: [],
      },
    ],
    type: 'delivery',
    status: 'completed',
    address: addresses[0],
    subtotal: 9.0,
    tax: 0.9,
    deliveryFee: 2.5,
    total: 12.4,
    createdAt: '2026-02-05T14:20:00Z',
    updatedAt: '2026-02-05T15:10:00Z',
    rating: 5,
    review: 'Great coffee, fast delivery!',
  },
];

export const ingredients = [
  { id: '1', name: 'Coffee Beans', unit: 'kg', quantity: 45, minQuantity: 10, price: 25 },
  { id: '2', name: 'Milk', unit: 'L', quantity: 30, minQuantity: 15, price: 3 },
  { id: '3', name: 'Sugar', unit: 'kg', quantity: 8, minQuantity: 5, price: 2 },
  { id: '4', name: 'Chocolate Powder', unit: 'kg', quantity: 5, minQuantity: 3, price: 15 },
  { id: '5', name: 'Matcha Powder', unit: 'kg', quantity: 3, minQuantity: 2, price: 35 },
  { id: '6', name: 'Vanilla Syrup', unit: 'L', quantity: 4, minQuantity: 2, price: 12 },
  { id: '7', name: 'Caramel Syrup', unit: 'L', quantity: 2, minQuantity: 2, price: 12 },
  { id: '8', name: 'Paper Cups (S)', unit: 'pcs', quantity: 150, minQuantity: 100, price: 0.15 },
  { id: '9', name: 'Paper Cups (M)', unit: 'pcs', quantity: 200, minQuantity: 100, price: 0.2 },
  { id: '10', name: 'Paper Cups (L)', unit: 'pcs', quantity: 120, minQuantity: 100, price: 0.25 },
];

export const shifts = [
  {
    id: '1',
    staffId: '2',
    date: '2026-02-06',
    startTime: '08:00',
    endTime: '16:00',
    role: 'Barista',
  },
  {
    id: '2',
    staffId: '3',
    date: '2026-02-06',
    startTime: '14:00',
    endTime: '22:00',
    role: 'Cashier',
  },
  {
    id: '3',
    staffId: '2',
    date: '2026-02-07',
    startTime: '08:00',
    endTime: '16:00',
    role: 'Barista',
  },
  {
    id: '4',
    staffId: '3',
    date: '2026-02-07',
    startTime: '14:00',
    endTime: '22:00',
    role: 'Cashier',
  },
];

export const attendance = [
  {
    id: '1',
    staffId: '2',
    date: '2026-02-06',
    checkIn: '08:05',
    checkOut: '16:00',
    status: 'late',
  },
  {
    id: '2',
    staffId: '3',
    date: '2026-02-06',
    checkIn: '14:00',
    status: 'present',
  },
];

export const requests = [
  {
    id: '1',
    staffId: '2',
    type: 'leave',
    startDate: '2026-02-10',
    endDate: '2026-02-10',
    reason: 'Personal day',
    status: 'pending',
    createdAt: '2026-02-06T11:00:00Z',
  },
  {
    id: '2',
    staffId: '3',
    type: 'overtime',
    startDate: '2026-02-07',
    endDate: '2026-02-07',
    reason: 'Extra shift',
    status: 'approved',
    createdAt: '2026-02-06T12:00:00Z',
    approvedBy: '4',
    approvedAt: '2026-02-06T13:00:00Z',
  },
];

export const vouchers = [
  {
    id: '1',
    code: 'WELCOME10',
    discount: 10,
    type: 'percentage',
    minOrder: 10,
    expiresAt: '2026-03-31',
    usageLimit: 100,
    usageCount: 45,
  },
  {
    id: '2',
    code: 'FREESHIP',
    discount: 2.5,
    type: 'fixed',
    minOrder: 15,
    expiresAt: '2026-02-28',
    usageLimit: 50,
    usageCount: 12,
  },
  {
    id: '3',
    code: 'LOYALTY50',
    discount: 50,
    type: 'percentage',
    minOrder: 50,
    expiresAt: '2026-12-31',
    usageLimit: 10,
    usageCount: 3,
  },
];

// Analytics Data
export const revenueData = [
  { date: 'Feb 1', revenue: 1250, orders: 45 },
  { date: 'Feb 2', revenue: 1450, orders: 52 },
  { date: 'Feb 3', revenue: 1680, orders: 61 },
  { date: 'Feb 4', revenue: 1520, orders: 55 },
  { date: 'Feb 5', revenue: 1890, orders: 68 },
  { date: 'Feb 6', revenue: 2100, orders: 75 },
];

export const topProducts = [
  { name: 'Cappuccino', sales: 156, revenue: 624 },
  { name: 'Latte', sales: 142, revenue: 568 },
  { name: 'Americano', sales: 98, revenue: 294 },
  { name: 'Mocha', sales: 87, revenue: 391.5 },
  { name: 'Caramel Macchiato', sales: 76, revenue: 380 },
];

export const ordersByType = [
  { type: 'Dine-in', value: 45, fill: '#6F4E37' },
  { type: 'Takeaway', value: 35, fill: '#8B9556' },
  { type: 'Delivery', value: 20, fill: '#D4A574' },
];
