const { StatusCodes } = require('http-status-codes');

const User = require('../models/user.model');
const Category = require('../models/category.model');
const { msg } = require('../constant');
const { categoryValidate } = require('../validation');
const { validateFields, sendErrorResponse, notFoundItem, pagination, cache } = require('../utils');

/* create category */
const createCategory = async (req, res) => {
  try {
    const decoded = req.user;
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
const listCategories = async (req, res) => {
  try {
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);
    const cacheKey = `cache:categories:page=${page}:limit=${limit}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(StatusCodes.OK).json(cachedData);
    }

    const [categories, total] = await Promise.all([
      Category.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
const getCategory = async (req, res) => {
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
const deleteCategory = async (req, res) => {
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

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  deleteCategory,
};
