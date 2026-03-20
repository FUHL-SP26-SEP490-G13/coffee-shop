const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Shop Management System - SEP490_G13',
      version: '1.0.0',
      description: 'API documentation for Coffee Shop Management System',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server',
      },
      {
        url: 'https://api.coffeeshop.local',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication. Include the token in the Authorization header.',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Retrieved successfully',
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                pageSize: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },
        // Product schema
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Espresso',
            },
            description: {
              type: 'string',
              example: 'Strong coffee shot',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 25000,
            },
            image: {
              type: 'string',
              example: 'image_url',
            },
            categoryId: {
              type: 'integer',
              example: 1,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // User schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              example: 'username',
            },
            fullName: {
              type: 'string',
              example: 'Full Name',
            },
            phoneNumber: {
              type: 'string',
              example: '0123456789',
            },
            roleId: {
              type: 'integer',
              example: 4,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Auth response
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        // Category schema
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Coffee',
            },
            slug: {
              type: 'string',
              example: 'coffee',
            },
            description: {
              type: 'string',
              example: 'All coffee products',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Order schema
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            code: {
              type: 'string',
              example: 'ORD-001',
            },
            userId: {
              type: 'integer',
              example: 1,
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 100000,
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
              example: 'pending',
            },
            paymentMethod: {
              type: 'string',
              example: 'credit_card',
            },
            deliveryAddress: {
              type: 'string',
              example: '123 Main St',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Missing or invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request - Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
