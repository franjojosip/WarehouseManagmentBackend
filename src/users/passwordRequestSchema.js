const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let passwordRequest = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        isUsed: {
            type: Boolean,
            default: false
        },
    },
    {
      timestamps: true
    },
    { collection: "passwordrequests" }
);

module.exports = mongoose.model("passwordRequest", passwordRequest);
