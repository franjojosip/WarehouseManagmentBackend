const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let warehouse = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location_id: {
      type: Schema.Types.ObjectId,
      ref: "location",
      required: true,
    },
    user_ids: [{
      type: Schema.Types.ObjectId,
      ref: "user",
    }],
  },
  {
    timestamps: true
  },
  { collection: "warehouses" }
);

module.exports = mongoose.model("warehouse", warehouse);
