import mongoose, { Schema, Model } from 'mongoose';
import { ICategory } from '../types';

export type CategoryModel = Model<ICategory>;

const CategorySchema = new Schema<ICategory, CategoryModel>(
  {
    categoryName: {
      type: String,
      required: true,
      maxlength: 60,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    user: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

/* performance indexes */
CategorySchema.index({ categoryName: 1 });
CategorySchema.index({ createdAt: -1 });

export const Category = mongoose.model<ICategory, CategoryModel>('Category', CategorySchema);
export default Category;
