const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 400;
        message = 'Duplicate entry - Record already exists';
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        message = 'Invalid reference - Related record not found';
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 400;
        message = 'Cannot delete - Record is being referenced';
        break;
      case 'ER_BAD_FIELD_ERROR':
        statusCode = 400;
        message = 'Invalid field in query';
        break;
      case 'ER_PARSE_ERROR':
        statusCode = 400;
        message = 'SQL syntax error';
        break;
      case 'ECONNREFUSED':
        statusCode = 503;
        message = 'Database connection refused';
        break;
      case 'PROTOCOL_CONNECTION_LOST':
        statusCode = 503;
        message = 'Database connection lost';
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // Send response
  const response = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
