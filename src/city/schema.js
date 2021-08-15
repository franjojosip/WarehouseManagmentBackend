const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let city = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    zip_code: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "cities" }
);

module.exports = mongoose.model("city", city);
