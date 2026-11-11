import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config';
import { IUser, IUserMethods } from '../types';

const saltNum = 10;
const roles = ['super_admin', 'collaborator', 'staff'] as const;

type UserModel = Model<IUser, object, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'super_admin',
    },
    address: {
      area: {
        type: String,
      },
      landmark: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* middleware to hash the password */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(saltNum);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

/* compare both passwords */
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password || '');
  } catch (err) {
    throw new Error(String(err));
  }
};

/* generate Access Token */
UserSchema.methods.generateAccessToken = function (): string {
  const payload = {
    userid: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, envConfig.ACCESS_TOKEN_SECRET, {
    expiresIn: envConfig.ACCESS_TOKEN_EXPTIME as jwt.SignOptions['expiresIn'],
  });
};

/* generate Refresh Token */
UserSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    userid: this._id,
  };

  return jwt.sign(payload, envConfig.REFRESH_TOKEN_SECRET, {
    expiresIn: envConfig.REFRESH_TOKEN_EXPTIME as jwt.SignOptions['expiresIn'],
  });
};

/* generate JWT token (legacy fallback alias) */
UserSchema.methods.generateAuthToken = function (): string {
  return this.generateAccessToken();
};

/* performance indexes */
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
export default User;
