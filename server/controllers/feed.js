const { validationResult } = require('express-validator');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    message: 'Success!',
    posts: [{
      _id: 1,
      title: 'First post',
      content: 'This is  the first post',
      imageUrl: 'images/book.jpg',
      creator: { name: 'Arkadii' },
      createdAt: new Date()
    }]
  })
}

exports.createPosts = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect.',
      errors: errors.array()
    })
  }

  const { title, content } = req.body;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: 'images/book.jpg',
    creator: { name: 'Arkadii' },
  });
  post.save()
    .then(result => {
      res.status(201).json({
        message: 'Post created successfuly!',
        post: result,
      })
    })
    .catch(err => {
      console.log(err)
    });


}