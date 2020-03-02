const express = require('express');

const router = express.Router();

const {body} = require('express-validator/check');

const feedCtrl = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');

router.get('/posts',isAuth, feedCtrl.getPosts);

router.post('/post', isAuth,[
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})
] ,feedCtrl.createPost);

router.get('/post/:postId',isAuth, feedCtrl.getPost);

router.put('/post/:postId',isAuth, [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})
], feedCtrl.updatePost);

router.delete('/post/:postId', isAuth,feedCtrl.deletePost);

module.exports = router;