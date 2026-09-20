const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    productID: {
      type: String,
      required: true,
    },

    torque: {
      type: Number,
      required: true,
    },

    toolWear: {
      type: Number,
      required: true,
    },

    rotationalSpeed: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model(
  'Alert',
  alertSchema
);