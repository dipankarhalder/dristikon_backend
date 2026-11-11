import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/user.model';
import Category from '../models/category.model';
import { msg } from '../constant';
import { categoryValidate } from '../validation';
import { validateFields, sendErrorResponse, notFoundItem, pagination, cache } from '../utils';
import { AuthenticatedRequest } from '../types';

/* create category */
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    const { error, value } = categoryValidate.categoryInfoSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }

    const { categoryName, description } = value;
    const existingCategory = await Category.findOne({
      categoryName,
    });
    if (existingCategory) {
      return validateFields(res, msg.categoryMsg.categoryAlreadyExist);
    }

    const user = await User.findById(decoded.userid).select('-password -refreshToken').lean();
    if (!user) {
      return notFoundItem(res, msg.userMsg.userNotFound);
    }

    const newCategory = new Category({
      categoryName,
      description,
      user,
    });

    await newCategory.save();

    // Invalidate cached categories
    await cache.delPattern('cache:categories:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      category: newCategory,
      message: msg.categoryMsg.newCategoryCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of categories with pagination and cache */
export const listCategories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);
    const cacheKey = `cache:categories:page=${page}:limit=${limit}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(StatusCodes.OK).json(cachedData);
    }

    const [categories, total] = await Promise.all([
      Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(),
    ]);

    const responsePayload = {
      status: StatusCodes.OK,
      list: categories,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    };

    await cache.set(cacheKey, responsePayload, 180);

    return res.status(StatusCodes.OK).json(responsePayload);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get category */
export const getCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = req.params.id;
    const categoryDetails = await Category.findById(categoryId).lean();
    if (!categoryDetails) {
      return notFoundItem(res, msg.categoryMsg.categoryNotFound);
    }
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      details: categoryDetails,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* delete category */
export const deleteCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return notFoundItem(res, msg.categoryMsg.categoryNotFound);
    }

    // Invalidate cached categories
    await cache.delPattern('cache:categories:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.categoryMsg.categoryDeleted,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  createCategory,
  listCategories,
  getCategory,
  deleteCategory,
};
