const Joi = require('joi');

const productIdSchema = Joi.object({
  productId: Joi.number().integer().required(),
});

const productSizeIdSchema = Joi.object({
  id: Joi.number().integer().required(),
});

module.exports = {
  productIdSchema,
  productSizeIdSchema,
};
