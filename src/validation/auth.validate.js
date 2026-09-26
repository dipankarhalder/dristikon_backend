const Joi = require('joi');
const { msg } = require('../constant');

const userInfoSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': msg.userMsg.requireName,
  }),
  email: Joi.string().email().required().messages({
    'string.empty': msg.userMsg.requireEmail,
    'string.email': msg.userMsg.validateUserEmail,
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': msg.userMsg.requirePassword,
    'string.min': msg.userMsg.minimumPassword,
  }),
  phone: Joi.string().min(10).required().messages({
    'string.empty': msg.userMsg.requirePhone,
    'string.min': msg.userMsg.minimumPhone,
  }),
  role: Joi.string().valid('super_admin', 'collaborator', 'staff').required().messages({
    'any.only': msg.userMsg.requireRole,
  }),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': msg.userMsg.requireEmail,
    'string.email': msg.userMsg.validateUserEmail,
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': msg.userMsg.requirePassword,
    'string.min': msg.userMsg.minimumPassword,
  }),
});

const passwordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required().messages({
    'string.empty': msg.userMsg.requireOldPassword,
    'string.min': msg.userMsg.oldMinimumPassword,
  }),
  newPassword: Joi.string().min(6).required().not(Joi.ref('oldPassword')).messages({
    'string.empty': msg.userMsg.requireNewPassword,
    'string.min': msg.userMsg.newMinimumPassword,
    'any.only': msg.userMsg.compareBothPassword,
  }),
});

module.exports = {
  userInfoSchema,
  userLoginSchema,
  passwordSchema,
};
