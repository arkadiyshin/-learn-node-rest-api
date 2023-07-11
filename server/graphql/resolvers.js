const bcrypt = require('bcrypt');
const User = require('../models/user');

module.exports = {
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;
    try {
      const existingUser = await User.findOne({ email: email })

      if (existingUser) {
        const error = new Error('User exists alreay.');
        throw error;
      }

      const hashedPw = await bcrypt.hash(password, 12)
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
      });
      const createdUser = await user.save();
      return { ...createdUser._doc, _id: createdUser._id.toString() }
    } catch (error) {

    }

  }
}