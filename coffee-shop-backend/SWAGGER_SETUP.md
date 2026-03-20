# Swagger API Documentation Setup

## Overview

Swagger documentation has been integrated into the Coffee Shop Backend API. This allows developers and API consumers to explore and test all available endpoints interactively.

## Installation

### 1. Install Required Packages

The required packages have been added to `package.json`:
- `swagger-jsdoc` - Convert JSDoc comments to OpenAPI specification
- `swagger-ui-express` - Serve Swagger UI in Express

Run the following command to install:

```bash
npm install
```

## Accessing Documentation

Once the server is running, access the Swagger documentation at:

### Development Environment
- **Swagger UI**: http://localhost:5000/api/docs
- **Swagger JSON**: http://localhost:5000/api/swagger.json

### Features
- Interactive API documentation
- Try-it-out functionality (test endpoints directly)
- Bearer token authentication support
- Request/response examples
- Schema definitions

## API Documentation Structure

### 1. Comment Format

The API uses JSDoc comments with Swagger annotations:

```javascript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User login
 *     description: Authenticate user and get JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', AuthController.login);
```

### 2. Configuration

The main Swagger configuration is in `src/config/swagger.js`:
- Defines API info, servers, and security schemes
- Contains reusable schema definitions
- Configures common response objects
- Sets up Bearer token authentication

### 3. Documented Endpoints

Currently documented in `src/routes/auth.routes.js`:
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/send-otp` - Send OTP to email
- POST `/auth/verify-email` - Verify email with OTP
- GET `/auth/profile` - Get user profile
- PUT `/auth/profile` - Update user profile
- POST `/auth/change-password` - Change password
- POST `/auth/logout` - Logout user
- POST `/auth/refresh-token` - Refresh access token
- GET `/auth/address` - Get user addresses
- POST `/auth/address` - Create new address
- PUT `/auth/address/{id}` - Update address
- DELETE `/auth/address/{id}` - Delete address

## Adding Documentation to New Routes

To document new endpoints, follow these steps:

### Step 1: Add JSDoc Comments to Route File

```javascript
/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve paginated list of products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', ProductController.getAll);
```

### Step 2: Reference Schemas

Use predefined schemas in `src/config/swagger.js`:
- `AuthResponse` - Authentication response
- `Product` - Product object
- `User` - User object
- `Category` - Category object
- `Order` - Order object
- `SuccessResponse` - Standard success response
- `ErrorResponse` - Standard error response
- `PaginatedResponse` - Paginated data response

### Step 3: Use Common Responses

Reference common response definitions:
- `NotFound` - 404 response
- `Unauthorized` - 401 response
- `Forbidden` - 403 response
- `BadRequest` - 400 response

Example:
```javascript
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
```

## Schema Definitions

### Adding New Schemas

Edit `src/config/swagger.js` and add to `components.schemas`:

```javascript
// In swagger.js
Article: {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      example: 1,
    },
    title: {
      type: 'string',
      example: 'Article Title',
    },
    content: {
      type: 'string',
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
}
```

Then use in documentation:
```javascript
/**
 * @swagger
 * responses:
 *   200:
 *     schema:
 *       $ref: '#/components/schemas/Article'
 */
```

## Authentication

### Bearer Token

To document protected endpoints, use:

```javascript
/**
 * @swagger
 * /protected-endpoint:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```

In Swagger UI, click "Authorize" button and paste the JWT token.

## Testing Endpoints

1. Navigate to http://localhost:5000/api/docs
2. Find the endpoint you want to test
3. Click "Try it out"
4. Fill in required parameters and request body
5. Click "Execute"
6. View the response

## Common Tags

Organize endpoints by features:
- `Auth` - Authentication related
- `Products` - Product management
- `Categories` - Category management
- `Users` - User management
- `Orders` - Order management
- `Reviews` - Review management
- `Admin` - Admin operations

## Response Format

All API responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Retrieved successfully",
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error detail"
    }
  ]
}
```

## Swagger Configuration Examples

### Custom Title & Description
```javascript
// In swagger.js definition
info: {
  title: 'Coffee Shop Management System API',
  version: '1.0.0',
  description: 'API documentation for Coffee Shop Management System',
}
```

### Multiple Servers
```javascript
servers: [
  {
    url: 'http://localhost:5000',
    description: 'Development Server',
  },
  {
    url: 'https://api.coffeeshop.local',
    description: 'Production Server',
  },
]
```

### Custom Styling
```javascript
// In app.js swagger setup
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Coffee Shop API Documentation',
}));
```

## Troubleshooting

### Endpoints not showing in Swagger UI

1. Ensure JSDoc comments have correct syntax with `@swagger` tag
2. Check that route file is included in `apis` array in `swagger.js`:
   ```javascript
   apis: [
     './src/routes/*.js',
     './src/controllers/*.js',
   ]
   ```
3. Verify server is running

### Cannot test endpoints

1. Check that endpoint has correct HTTP method (GET, POST, etc.)
2. Ensure all required parameters are filled
3. Verify authentication token is valid for protected endpoints

### Schema not found error

1. Check schema name spelling in `$ref`
2. Verify schema is defined in `components.schemas`
3. Use correct reference format: `#/components/schemas/SchemaName`

## Best Practices

1. **Keep documentation up-to-date** - Update JSDoc comments when changing endpoints
2. **Use consistent formatting** - Follow the existing documentation style
3. **Document all parameters** - Include required flag, type, and examples
4. **Provide examples** - Use realistic data in example values
5. **Document error cases** - Include possible error responses
6. **Use descriptive summaries** - Help users understand endpoint purpose
7. **Group by feature** - Use tags to organize related endpoints
8. **Reference schemas** - Reuse schema definitions instead of repeating them

## Resources

- [Swagger/OpenAPI Documentation](https://swagger.io/docs/specification/3-0-0/)
- [swagger-jsdoc GitHub](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express GitHub](https://github.com/scottie1984/swagger-ui-express)
- [JSDoc Reference](https://jsdoc.app/)

## Next Steps

To complete API documentation:

1. Add JSDoc comments to all remaining route files:
   - Product routes
   - Category routes
   - Order routes
   - User routes
   - etc.

2. Update schemas as needed for project-specific types

3. Test all endpoints in Swagger UI

4. Share Swagger documentation link with frontend developers

Example:
```bash
# After running npm install
npm start

# Then visit: http://localhost:5000/api/docs
```
