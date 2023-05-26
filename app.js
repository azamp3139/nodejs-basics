const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
import data from './resource.json';


const MONGODB_URI = data.mongoURI;

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  }
  else {
    cb(null, false);
  }
}

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  next();
})
app.use(bodyParser.json());

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

// general error handler
app.use((error, req, res, next) => {
  console.log('Error :- ', error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data || '';
  res.status(status).json({
    message: message,
    data: data
  })
})

mongoose.connect(MONGODB_URI)
  .then(result => {
    const server = app.listen(8080);
    console.log('DB connect success');
    const io = require('./socket').init(server);
    io.on('connection', socket => {
    })

  })
  .catch(err => console.log('Unable to connect'));
