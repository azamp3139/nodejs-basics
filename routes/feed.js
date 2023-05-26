const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const feedController = require('../controllers/feed');
const isAuth = require('../middleware/auth');


router.get('/posts', isAuth, feedController.getPosts);

router.get('/post', isAuth, feedController.getSinglePost);

router.post('/post', isAuth, [
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 5 })
], feedController.createPost);

router.put('/post/:postId', isAuth, feedController.updatePost);
router.delete('/post/:postId', isAuth, feedController.deletePost)


module.exports = router;