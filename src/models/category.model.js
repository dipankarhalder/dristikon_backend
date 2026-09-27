const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
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

module.exports = mongoose.model('Category', CategorySchema);
