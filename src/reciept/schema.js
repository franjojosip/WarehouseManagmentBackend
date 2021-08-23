const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let reciept = new Schema(
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
    quantity: {
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
  { collection: "reciepts" }
);

module.exports = mongoose.model("reciept", reciept);
