const { StatusCodes } = require('http-status-codes');

const User = require('../models/user.model');
const Category = require('../models/category.model');
const { msg } = require('../constant');
const { categoryValidate } = require('../validation');
const { validateFields, sendErrorResponse, notFoundItem } = require('../utils');

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

    const user = await User.findById(decoded.userid).select('-password');
    const newCategory = new Category({
      categoryName,
      description,
      user,
    });

    await newCategory.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      category: newCategory,
      message: msg.categoryMsg.newCategoryCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of categories */
const listCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      list: categories,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get category */
const getCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryDetails = await Category.findById(categoryId);
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
    const category = await Category.findById(categoryId);
    if (!category) {
      return notFoundItem(res, msg.categoryMsg.categoryNotFound);
    }
    await Category.findByIdAndDelete(categoryId);
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
