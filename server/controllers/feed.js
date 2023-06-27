const { validationResult } = require('express-validator');

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

  res.status(201).json({
    message: 'Post created successfuly!',
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: { name: 'Arkadii' },
      createdAt: new Date()
    }
  })
}