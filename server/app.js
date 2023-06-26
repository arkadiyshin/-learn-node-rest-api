const express = require('express')
const app = express();


const feedRouter = require('./routes/feed');

app.use(feedRouter);

app.listen(8080);