const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventId: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    event: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

/* performance indexes */
TransactionSchema.index({ eventId: 1, createdAt: -1 });
TransactionSchema.index({ customerId: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
