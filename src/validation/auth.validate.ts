import Joi from 'joi';
import { msg } from '../constant';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
const PASSWORD_COMPLEXITY_MSG =
  'Password must be at least 6 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&).';

export const userInfoSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': msg.userMsg.requireName,
  }),
  email: Joi.string().email().required().messages({
    'string.empty': msg.userMsg.requireEmail,
    'string.email': msg.userMsg.validateUserEmail,
  }),
  password: Joi.string().min(6).pattern(PASSWORD_PATTERN).required().messages({
    'string.empty': msg.userMsg.requirePassword,
    'string.min': msg.userMsg.minimumPassword,
    'string.pattern.base': PASSWORD_COMPLEXITY_MSG,
  }),
  phone: Joi.string().min(10).required().messages({
    'string.empty': msg.userMsg.requirePhone,
    'string.min': msg.userMsg.minimumPhone,
  }),
  role: Joi.string().valid('super_admin', 'collaborator', 'staff').required().messages({
    'any.only': msg.userMsg.requireRole,
  }),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': msg.userMsg.requireEmail,
    'string.email': msg.userMsg.validateUserEmail,
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': msg.userMsg.requirePassword,
    'string.min': msg.userMsg.minimumPassword,
  }),
});

export const passwordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required().messages({
    'string.empty': msg.userMsg.requireOldPassword,
    'string.min': msg.userMsg.oldMinimumPassword,
  }),
  newPassword: Joi.string().min(6).pattern(PASSWORD_PATTERN).required().not(Joi.ref('oldPassword')).messages({
    'string.empty': msg.userMsg.requireNewPassword,
    'string.min': msg.userMsg.newMinimumPassword,
    'string.pattern.base': PASSWORD_COMPLEXITY_MSG,
    'any.only': msg.userMsg.compareBothPassword,
  }),
});

export default {
  userInfoSchema,
  userLoginSchema,
  passwordSchema,
};
