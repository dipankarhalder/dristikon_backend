const Joi = require('joi');
const { msg } = require('../constant');

const consumerInfoSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': msg.userMsg.requireName,
  }),
  email: Joi.string().email().required().messages({
    'string.empty': msg.userMsg.requireEmail,
    'string.email': msg.userMsg.validateUserEmail,
  }),
  phone: Joi.string().min(10).required().messages({
    'string.empty': msg.userMsg.requirePhone,
    'string.min': msg.userMsg.minimumPhone,
  }),
  area: Joi.string().required().messages({
    'string.empty': 'Area is required.',
  }),
  landmark: Joi.string().optional(),
  city: Joi.string().required().messages({
    'string.empty': 'City is required.',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required.',
  }),
  pincode: Joi.string().required().messages({
    'string.empty': 'Pincode is required.',
  }),
});

module.exports = {
  consumerInfoSchema,
};
