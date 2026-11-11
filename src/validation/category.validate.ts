import Joi from 'joi';
import { msg } from '../constant';

export const categoryInfoSchema = Joi.object({
  categoryName: Joi.string().max(60).required().messages({
    'string.empty': msg.categoryMsg.requireCategoryName,
    'string.max': msg.categoryMsg.maxName,
  }),
  description: Joi.string().max(255).required().messages({
    'string.empty': msg.categoryMsg.requireDescription,
    'string.max': msg.categoryMsg.maxDescription,
  }),
});

export default {
  categoryInfoSchema,
};
