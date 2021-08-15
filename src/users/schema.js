const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let user = new Schema(
  {
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "role",
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true
  },
  { collection: "users" }
);

user.set("toJSON", {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.password;
  },
});

module.exports = mongoose.model("user", user);
