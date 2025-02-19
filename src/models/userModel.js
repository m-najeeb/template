const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { role } = require("../../api/enums/userEnum");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  country: {
    type: String,
  },
  role: {
    type: Number,
    enum: [role.admin, role.user],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
  },
  otp: {
    type: String,
    expires: "5m",
  },
  otpExpiration: {
    type: Date,
  },
});

userSchema.plugin(timestamps);

const UserSchema = mongoose.model("Users", userSchema, "Users");
module.exports = { UserSchema };
