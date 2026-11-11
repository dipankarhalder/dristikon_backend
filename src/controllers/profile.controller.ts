import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/user.model';
import { msg } from '../constant';
import { authValidate } from '../validation';
import { validateFields, sendErrorResponse, notFoundItem, pagination } from '../utils';
import { AuthenticatedRequest } from '../types';

/* user profile */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }
    const user = await User.findById(decoded.userid).select('-password -refreshToken').lean();
    if (!user) {
      return notFoundItem(res, msg.userMsg.userNotFound);
    }
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: user,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* user profile lists with role filter and pagination */
export const getProfileLists = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const role = req.query.role as string | undefined;
    const filter = role && role !== 'all' ? { role } : {};

    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);

    const [userList, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: userList,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* create profile */
export const createProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return validateFields(res, msg.userMsg.emailAlreadyExist);
    }
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role,
      address: {
        area: req.body.area,
        landmark: req.body.landmark,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
      },
    });
    await user.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.userMsg.newUserCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* update password */
export const updatePassword = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }
    const { error, value } = authValidate.passwordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const user = await User.findById(decoded.userid);
    if (!user) {
      return validateFields(res, msg.userMsg.userNotFound);
    }
    const isMatch = await user.comparePassword(value.oldPassword);
    if (!isMatch) {
      return validateFields(res, msg.userMsg.userWrongPassword);
    }
    user.password = value.newPassword;
    await user.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.userMsg.updatedUserPassword,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* update address */
export const updateAddress = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }
    const { name, phone, area, landmark, city, state, pincode } = req.body;
    const user = await User.findById(decoded.userid);
    if (!user) {
      return validateFields(res, msg.userMsg.userNotFound);
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    user.address = { area, landmark, city, state, pincode };
    await user.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.userMsg.updatedUserProfile,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  getProfile,
  getProfileLists,
  createProfile,
  updatePassword,
  updateAddress,
};
