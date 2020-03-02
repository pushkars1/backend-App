const { validationResult } = require('express-validator/check');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  let posts;
  let creator;

  User.findById(req.userId)
    .then(user => {
        creator = user;
        return Post.find().countDocuments() 
    })
    .then(count => {
        totalItems = count;
        return Post.find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
    })
    .then(posts => {
      res.status(200).json({ posts: posts, creator: {name : creator.name}, totalItems: totalItems });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    throw error;
  }
  let creator;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl: req.file.path.replace('\\', '/')
  });

  post
    .save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      res
        .status(201)
        .json({
          post: post,
          creator: { _id: creator._id, name: creator.name },
          message: 'post created successfully'
        })
        .catch(err => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
let post;
  Post.findById(postId)
    .then(p => {
      if (!p) {
        const error = new Error('No post found');
        error.statusCode = 404;
        throw error;
      }
        post = p;
        return User.findById(req.userId);
    }).then(user => { 
        res.status(200).json({ post: post, creator : {name: user.name},  message: 'post found successfully' })})
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('validation failed');
    error.statusCode = 422;
    throw error;
  }



  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }

  if (!imageUrl) {
    const error = new Error('Image not picked');
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post found');
        error.statusCode = 404;
        throw error;
      }

    if(post.creator.toString() !== req.userId) {
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
    }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      if (post.imageUrl !== imageUrl) {
        clearImage(imageUrl);
      }

      return post.save();
    })
    .then(result => {
      res
        .status(200)
        .json({ message: 'post updated successfully', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post found');
        error.statusCode = 404;
        throw error;
      }
    if(post.creator.toString() !== req.userId) {
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
    }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      res.status(200).json({ message: 'post deleted successfully' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = filepath => {
  filepath = path.join(__dirname, '..', filepath);
  fs.unlink(filepath, err => console.log(err));
};
