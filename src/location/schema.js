const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let location = new Schema(
  {
    street: {
      type: String,
      required: true,
    },
    city_id: {
      type: Schema.Types.ObjectId,
      ref: "city",
      required: true,
    },
  },
  {
    timestamps: true
  },
  { collection: "locations" }
);

module.exports = mongoose.model("location", location);
