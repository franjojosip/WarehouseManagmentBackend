const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let stock = new Schema(
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
    quantity: {
      type: Number,
      required: true,
    },
    minimum_quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "stocks" }
);

module.exports = mongoose.model("stock", stock);
