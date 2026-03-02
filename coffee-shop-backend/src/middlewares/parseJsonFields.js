module.exports = (fields = []) => {
  return (req, res, next) => {
    fields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: `Invalid JSON format in field: ${field}`,
          });
        }
      }
    });

    next();
  };
};