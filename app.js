const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');

const app = express();

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination : (req, file ,cb) => {
        cb(null, 'images');
    },
    filename : (req, file, cb) => {
        cb(null, uuidv4() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    }
    else {
        cb(null, false);
    }
}

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));

app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);


app.use((error, req, res, next) => {
    const errorMsg = error.message;
    const status = error.statusCode;
    res.status(status).json({message: errorMsg}); 
})

mongoose.connect('mongodb+srv://pushkar:milky2019@cluster0-dvl5l.mongodb.net/messages?retryWrites=true&w=majority')
.then(res => {
    app.listen(3021);
}).catch(err => {
    console.log(err)
})
