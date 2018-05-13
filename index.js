// import express library to handle interactions with the web
const express = require('express');

// import mongoose library to interact with mongo
const mongoose = require('mongoose');



const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// import cloudinary for avatar hosting
const cloudinary = require('cloudinary');



// import passport to make use of the cookies
const passport = require('passport');

// import keys file
const keys = require('./config/keys');

// importing cors for cross domain authentication
const cors = require('cors');

// import User file that contains the mongoose
// User model
require('./models/User');


// get the passport file that handles user OAuth
require('./services/passport');

// import connect-flash library to flash messages
const flash = require('connect-flash');

// connect to database
mongoose.connect(keys.mongoURI);

// define the app object
const app = express();


app.use(morgan('combined'));
//app.use(bodyParser.urlencoded({ limit : '50mb', extended : true, parameterLimit : 500000 }));
//app.use(bodyParser.json({ type : '*/*' }));


// Use app - pre set
app.set('view engine', 'ejs');

app.use(flash());

app.use(cors());

// call authRoutes file with the app object
require('./routes/authRoutes')(app);
require('./router')(app);



const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT);
