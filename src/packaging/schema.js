const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let packaging = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "packaging" }
);

module.exports = mongoose.model("packaging", packaging);
