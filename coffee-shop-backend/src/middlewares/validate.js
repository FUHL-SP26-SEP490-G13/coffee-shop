/**
 * Validation middleware
 * Validates request body, params, or query against Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
      convert: true, // Attempt to cast values to the correct type tức là covert "true"/"false" thành boolean, "123" thành number, ...
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;

    next();
  };
};

module.exports = validate;
