const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let role = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { collection: "roles" }
);

module.exports = mongoose.model("role", role);
