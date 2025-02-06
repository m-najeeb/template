const { UserSchema } = require("../models/userModel");

class UserQueries {
  async getUserByEmail(email) {
    return await UserSchema.findOne({ email: email });
  }

  async updateUserPassword(email, newPassword) {
    return await UserSchema.findOneAndUpdate(
      { email: email },
      { $set: { password: newPassword } },
      { new: true }
    );
  }

  async getUserByUsername(username) {
    return await UserSchema.findOne({ username: username });
  }

  async getUserByPhone(phone) {
    return await UserSchema.findOne({ phone: phone });
  }

  async getUserDetailsByData(data) {
    return await UserSchema.findOne({
      $or: [
        { email: data.email },
        { username: data.username },
        { phone: data.phone },
      ],
    });
  }

  async getUserById(id) {
    return await UserSchema.findById({ id: id });
  }

  async getUser(id) {
    return await UserSchema.findById(id);
  }

  async getBuyerById(id) {
    return await UserSchema.findById(id);
  }

  async getUserByIdForRefreshToken(id) {
    return await UserSchema.findById(id);
  }

  async getUserDetailsById(id) {
    return await UserSchema.findOne({ _id: id });
  }

  async createUser(data) {
    const user = new UserSchema(data);
    return await user.save();
  }
}

// Export an instance of the class to use its methods
module.exports = new UserQueries();
