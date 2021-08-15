const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let category = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "categories" }
);

module.exports = mongoose.model("category", category);
