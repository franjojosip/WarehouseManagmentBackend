const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let notification_type = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "notification_types" }
);

module.exports = mongoose.model("notification_type", notification_type);
