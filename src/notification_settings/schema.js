const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let notification_setting = new Schema(
  {
    day_of_week: {
      type: Number,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    notification_type_id: {
      type: Schema.Types.ObjectId,
      ref: "notification_type",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
  { collection: "notification_settings" }
);

module.exports = mongoose.model("notification_setting", notification_setting);
