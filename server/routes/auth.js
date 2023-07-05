const userController = require('../controllers/auth')

const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth')
const User = require('../models/user');

const router = express.Router();

router.put('/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User
          .findOne({ email: value })
          .then(userDoc => {
            if (userDoc) {
              return Promise.reject('E-Mail address already exist')
            }
          })
      }),
    body(
      'password',
      'Please enter a valid  password')
      .isAlphanumeric()
      .isLength({ min: 5 })
      .trim(),
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  userController.signup
);

router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User
          .findOne({ email: value })
          .then(userDoc => {
            if (userDoc) {
              return Promise.reject('E-Mail address already exist')
            }
          })
      }),
    body(
      'password',
      'Please enter a valid  password')
      .isAlphanumeric()
      .isLength({ min: 5 })
      .trim(),
  ],
  userController.login)

router.get('/status', isAuth, userController.getUserStatus)

router.patch('/status', [
  body('status')
    .trim()
    .not()
    .isEmpty()
],
  isAuth,
  userController.updateUserStatus)

module.exports = router;