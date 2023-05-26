const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require('../middleware/auth');

router.post('/signup', [
  body('email').isEmail().withMessage('Please enter a avalid email')
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (userDoc) {
          console.log('User doc',userDoc)
          return Promise.reject('Email already exists');
        }
      })
    }),
  body('password').trim().isLength({ min: 6 }),
  body('name').trim().not().isEmpty(),

], authController.addUser);

router.post('/login',authController.login);

router.get('/status',isAuth,authController.status);

router.post('/status',isAuth,authController.setStatus);

module.exports = router;