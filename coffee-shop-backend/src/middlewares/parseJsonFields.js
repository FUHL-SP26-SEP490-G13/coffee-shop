/**
 * Middleware to parse JSON string fields from form-data
 * @param {Array} fields - Array of field names to parse
 */
const parseJsonFields = (fields = []) => {
  return (req, res, next) => {
    fields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Định dạng ${field} không hợp lệ. Phải là JSON hợp lệ.`,
            errors: [
              {
                field: field,
                message: `Invalid JSON format for ${field}`,
              },
            ],
          });
        }
      }
    });
    next();
  };
};

module.exports = parseJsonFields;