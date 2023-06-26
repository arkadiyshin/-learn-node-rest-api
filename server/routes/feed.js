const feedController = require('../controllers/feed')

const express = require('express');

const router = express.Router();

router.get('/posts', feedController.getPosts);

module.exports = router;