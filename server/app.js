const express = require('express');
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

// const handler = createHandler({
//   path: '/graphql',
//   schema: graphqlSchema,
//   rootValue: graphqlResolver,
//   graphiql: true,
//   formatError(err) {
//     console.log(err)
//     if (!err.originalError) {
//       return err;
//     }
//     const data = err.originalError.data;
//     const message = err.message || 'An error occurred';
//     const code = err.code || 500;
//     return { message: message, status: code, data: data };

//   }
// });

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
app.use(auth);
//app.use(handler);
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