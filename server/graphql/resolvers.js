const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken')

const User = require('../models/user');
const Post = require('../models/post');
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

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authrnticatted')
      error.code = 401;
      throw error;
    }

    const { title, imageUrl, content } = postInput;

    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title is invalid.' })
    }
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
      errors.push({ message: 'Content is invalid.' })
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.')
      error.data = errors;
      error.code = 422;
      throw error;
    }


    // if (!req.file) {
    //   const error = new Error('No image provided.')
    //   error.statusCode = 422;
    //   throw error;
    // }
    const user = User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found.')
      error.code = 401;
      throw error;

    }
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: user,
    });

    try {
      const createdPost = await post.save();
      //const user = await User.findById(req.userId);
      user.posts.push(createdPost);
      await user.save();
      return {
        ...createdPost,
        _id: createdPost._id.toString(),
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString(),
      }
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
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