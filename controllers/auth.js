const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
exports.addUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('User Already exists');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        status: 'I am New'
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        msg: 'SignUp successfull',
        user: result
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })



};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email }).
    then(user => {
      if (!user) {
        const error = new Error('User account does not exists!');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Incorrect Password!');
        error.statusCode = 401;
        throw error;
      }
      let token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      }, 'somesecretkey', { expiresIn: '1hr' });

      res.status(201).json({
        msg: 'login successfull',
        token: token,
        userId: loadedUser._id.toString()
      })

    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.status = (req, res, next) => {
  User.findById(req.userId)
    .then(userDoc => {
      console.log()
      res.status(200).json({
        status: userDoc.status,
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}
exports.setStatus = (req, res, next) => {
  let status = req.body.status;
  User.findById(req.userId)
    .then(userDoc => {
      userDoc.status = status;
      return userDoc.save();
    })
    .then(result => {
      res.status(201).json({
        status: result.status,
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}