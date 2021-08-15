const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let product = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    packaging_id: {
      type: Schema.Types.ObjectId,
      ref: "packaging",
      required: false,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    subcategory_id: {
      type: Schema.Types.ObjectId,
      ref: "subcategory",
      required: false,
    },
  },
  {
    timestamps: true
  },
  { collection: "products" }
);

module.exports = mongoose.model("product", product);
