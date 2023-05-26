
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');
const PER_PAGE = 2;
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  try {
    const totalItems = await Post.find().countDocuments();
    const result = await Post.find().skip((currentPage - 1) * PER_PAGE).limit(PER_PAGE);
    res.status(200).json({
      message: 'Fetched posts successfully!',
      posts: result,
      totalItems: totalItems
    })
  }
  catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.getSinglePost = async (req, res, next) => {
  const postId = req.query.postId;
  try {
    const result = await Post.findById(postId);
    if (!result) {
      const error = new Error('Post not Found');
      error.statusCode = 422;
      throw error;
    }
    res.status(200).json({
      post: result
    })
  }
  catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);

  }

}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('validation Failed!');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('Image is not availble!');
    error.statusCode = 422;
    throw error;

  }
  // return res.status(422).json({
  //   message: 'validation failed, please enter valid input',
  //   errors: errors.array()
  // })
  const imageUrl = req.file.path.replace("\\", "/");
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  let creator;
  let feedData;
  post.save().then(result => {
    feedData = result;
    return User.findById(req.userId);
  })
    .then(userDoc => {
      creator = userDoc;
      userDoc.posts.push(post);
      return userDoc.save();
    })
    .then(result => {
      let socketIO = io.getIO();
      console.log('io details: ', socketIO);
      socketIO.emit('posts', {
        action: 'create',
        post: post
      });
      res.status(201).json({
        message: 'Post created successfully!',
        post: feedData,
        creator: {
          _id: result._id,
          name: result.name
        }
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })

}

exports.updatePost = (req, res, next) => {

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post available to update!');
        error.statusCode = 422;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then(result => {
      io.getIO().emit('posts', {
        action: 'update',
        post: result
      })
      res.status(201).json({
        msg: 'post Updated successfully',
        post: result
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })

}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId).then(post => {
    if (!post) {
      const error = new Error('No post available to update!');
      error.statusCode = 422;
      throw error;
    }
    clearImage(post.imageUrl);
    return Post.findByIdAndRemove(postId);
  })
    .then(result => {
      io.getIO().emit('posts', {
        action: 'delete',
        post: result
      })
      res.status(200).json({
        message: 'Post deleted successfully!',
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}