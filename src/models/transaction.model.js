const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    paidAmount: {
      type: Number,
      required: true,
    },
    pendingAmount: {
      type: Number,
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
    },
    event: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Transaction', TransactionSchema);
