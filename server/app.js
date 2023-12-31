const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { createHandler } = require('graphql-http/lib/use/express');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

require('dotenv').config();

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());
app.use(multer({ dest: 'images', storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, '/images')));

app.use(cors());
app.put('/post-image', (req, res, next) => {
  if (!req.auth) {
    throw new Error('Not authenticated');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(200).json({ message: 'File stored', filePath: req.file.path })
});
app.use(auth);
app.all('/graphql', (req, res) =>
  createHandler({
    schema: graphqlSchema,
    rootValue: {
      createUser: args => graphqlResolver.createUser(args, req),
      login: args => graphqlResolver.login(args, req),
      createPost: args => graphqlResolver.createPost(args, req),
      posts: args => graphqlResolver.posts(args, req),
      // post: args => graphqlResolver.post(args, req),
      // updatePost: args => graphqlResolver.updatePost(args, req),
      // deletePost: args => graphqlResolver.deletePost(args, req),
      // user: args => graphqlResolver.user(args, req),
      // updateStatus: args => graphqlResolver.updateStatus(args, req),
    },
  })(req, res)
);

app.use((error, req, res, next) => {
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
})

const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.igv9dig.mongodb.net/messages?retryWrites=true&w=majority`;

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(8080)
  })
  .catch(err => {
    console.log(err)
  })

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}