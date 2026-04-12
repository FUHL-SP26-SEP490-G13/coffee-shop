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

let swaggerUi = null;
let swaggerSpec = null;
try {
  swaggerUi = require('swagger-ui-express');
  swaggerSpec = require('./config/swagger');
} catch (error) {
  console.warn('[Swagger] Disabled because dependencies are missing:', error.message);
}

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Limit each IP to 30000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Swagger documentation (optional dependency)
if (swaggerUi && swaggerSpec) {
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 1,
      filter: true,
      showRequestHeaders: true,
      docExpansion: 'list',
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Coffee Shop API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
} else {
  app.get('/api/docs', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Swagger docs are temporarily unavailable. Install swagger-ui-express and swagger-jsdoc to enable.',
    });
  });

  app.get('/api/swagger.json', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Swagger spec is temporarily unavailable. Install swagger-jsdoc to enable.',
    });
  });
}

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
    documentation: 'http://localhost:5000/api/docs',
    swaggerJson: 'http://localhost:5000/api/swagger.json',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
