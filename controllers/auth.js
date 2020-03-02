const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  try {
    const hashPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name: name,
      password: hashPassword,
      email: email
    });

    const savedUser = await user.save();
    console.log(savedUser);
    res
      .status(200)
      .json({ message: 'user created successfully', userid: savedUser._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('user does not exists');
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Password do not match');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        name: user.name,
        userId: user._id.toString()
      },
      'somesupersecret',
      { expiresIn: '1h' }
    );
    res.status(200).json({ token: token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUserStatus = async (req, res, next) => {
  const user = User.findById(req.userId);
  try {
    if (!user) {
      const error = new Error('user not found');
      error.statusCode = 422;
      throw error;
    }

    res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('user not found');
      error.statusCode = 422;
      throw error;
    }

    user.status = req.body.status;
    user.save();
    res.json(200).json({ message: 'status updated successfully' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
