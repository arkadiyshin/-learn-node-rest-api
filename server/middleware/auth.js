const jwt = require('jsonwebtoken')

require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    // const error = new Error('Not authenticatedd')
    // error.statusCode = 401;
    // throw error;
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.isAuth = false;
    return next();
    // err.statusCode = 500;
    // throw err;
  }
  if (!decodedToken) {
    // const error = new Error('Not authenticatedd')
    // error.statusCode = 401;
    // throw error;
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
}