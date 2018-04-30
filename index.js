// import express library to handle interactions with the web
const express = require('express');

// import mongoose library to interact with mongo
const mongoose = require('mongoose');

//enable access to cookies
const cookieSession = require('cookie-session');

// import passport to make use of the cookies
const passport = require('passport');

// import keys file
const keys = require('./config/keys');

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

// middleware to pre-process cookies
app.use(
  //pass in configuration object for cookies
  cookieSession({
    // let cookies last 10 days before expiring
    maxAge: 10 * 24 * 60 * 60 * 1000,
    // encrypt cookie keys
    keys: [keys.cookieKey]
  })
);

// tell passport to make use of cookies
// to handle authentications
app.use(passport.initialize());
app.use(passport.session());

// call authRoutes file with the app object
require('./routes/authRoutes')(app);


app.get('/', (req,res) => {
  res.send({ hi: 'there' })
});

const PORT = process.env.PORT || 5000;

app.listen(PORT);
