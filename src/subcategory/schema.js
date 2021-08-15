const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let subcategory = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "subcategories" }
);

module.exports = mongoose.model("subcategory", subcategory);
