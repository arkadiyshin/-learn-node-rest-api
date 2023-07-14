const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken')

const User = require('../models/user');
require('dotenv').config();

module.exports = {
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid.' })
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'Password too short.' })
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.')
      error.data = errors;
      error.code = 422;
      throw error;
    }

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

  },
  login: async function ({ email, password }) {
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid.' })
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('User ot found.');
      error.code = 404;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong password.')
      error.statusCode = 401;
      throw error
    }

    const token = jwt.sign({
      email: user.email,
      userId: user._id.toString()
    },
      process.env.JWT_SECRET,
      { expiresIn: '1h' });

    return { token: token, userId: user._id.toString() }

  }
}