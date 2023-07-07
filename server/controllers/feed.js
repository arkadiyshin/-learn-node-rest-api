const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const ITEMS_PER_PAGE = 2;

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;

  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
      .populate('creator')
      .skip((+currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.status(200).json({
      message: 'Fetched posts successfuly!',
      posts: posts,
      totalItems: totalItems,
    })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.status = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('No image provided.')
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const { title, content } = req.body;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIo().emit('posts', { action: 'create', post: post })
    res.status(201).json({
      message: 'Post created successfuly!',
      post: post,
      creator: { _id: user._id, name: user.name }
    })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Could not find post.');
      error.status = 404;
      throw error;
    }
    res.status(200).json({
      message: 'post fetched',
      post: post,
    })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.status = 422;
    throw error;
  }

  const postId = req.params.postId;
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error('No file picked.')
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId)

    if (!post) {
      const error = new Error('Could not find post.');
      error.status = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized.')
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    await post.save()
    res.status(200).json({
      message: 'Post updated!',
      post: result,
    })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Could not find post.');
      error.status = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized.')
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.deleteOne({ _id: postId })
    const user = await User.findById(req.userId)
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({
      message: 'Post deleted!'
    })
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}