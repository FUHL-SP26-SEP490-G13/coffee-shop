const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan')
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { createPaymentLink } = require('./config/payos');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

app.use(morgan('dev'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const getRateLimitKey = (req) => {
  let ip = req.ip;

  if ((!ip || typeof ip !== 'string') && Array.isArray(req.ips) && req.ips.length > 0) {
    ip = req.ips[0];
  }

  if (!ip || typeof ip !== 'string') {
    ip = req.socket?.remoteAddress || '';
  }

  ip = String(ip);

  // Normalize IPv4-mapped IPv6 and strip accidental port suffix (seen on some proxies)
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip.includes('.') && /:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, '');

  return ip || 'unknown';
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Limit each IP to 30000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  keyGenerator: getRateLimitKey,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount routes
app.use('/api', routes);

// PayOS sample endpoint
app.post('/create-payment-link', createPaymentLink);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Coffee Shop Management API',
    version: '1.0.0',
    documentation: '/api',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
