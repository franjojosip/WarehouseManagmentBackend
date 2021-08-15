const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let stocktaking = new Schema(
  {
    warehouse_id: {
      type: Schema.Types.ObjectId,
      ref: "warehouse",
      required: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    counted_quantity: {
      type: Number,
      required: true,
    },
    real_quantity: {
      type: Number,
      required: true,
    },
    isSubmitted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  },
  { collection: "stocktakings" }
);

module.exports = mongoose.model("stocktaking", stocktaking);
