const express = require('express');
const {body} = require('express-validator/check');

const router = express.Router();
const User = require('../models/user');
const authCtrl = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, {req}) => {
            return User.findOne({email:value})
                .then(userdoc => {
                    if(userdoc) {
                        Promise.reject('E-mail already exists');
                    }
                })
        })
        .normalizeEmail(),
    body('password').trim().isLength({min:5}),
    body('name').trim().not().isEmpty()
], authCtrl.signup);

router.post('/login', authCtrl.login);

router.get('/status', isAuth, authCtrl.getUserStatus);

router.patch('/status', isAuth, authCtrl.updateUserStatus);

module.exports = router;