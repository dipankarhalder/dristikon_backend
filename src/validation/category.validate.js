const Joi = require('joi');
const { msg } = require('../constant');

const categoryInfoSchema = Joi.object({
  categoryName: Joi.string().max(60).required().messages({
    'string.empty': msg.categoryMsg.requireCategoryName,
    'string.max': msg.categoryMsg.maxName,
  }),
  description: Joi.string().max(255).required().messages({
    'string.empty': msg.categoryMsg.requireDescription,
    'string.max': msg.categoryMsg.maxDescription,
  }),
});

module.exports = {
  categoryInfoSchema,
};
