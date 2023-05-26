const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  let authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  let token;
  let decodedToken;
  try {
    token = authHeader.split(' ')[1];
    decodedToken = jwt.decode(token, 'somesecretkey');
  }
  catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
}