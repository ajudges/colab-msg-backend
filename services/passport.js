// import passport to handle user authentications
const passport = require('passport');

// import passport's local strategy
const LocalStrategy = require('passport-local').Strategy;

//import google strategy module for authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// import mongoose library
const mongoose = require('mongoose');

// import keys file
const keys = require('../config/keys');

// pull a model out of mongoose by giving
// a single argument
const User = mongoose.model('users');

// call serializeUser with the user just
// pulled out of the database to generate
// the identifying piece of info to put into cookie
passport.serializeUser((user, done) => {
  // user.id is the identifying piece of info
  // that will identify the user
  // i.e. unique identifier attached to
  // each user's record
  done(null, user.id);
});

// call deserializeUser to convert
// identifying piece of info in cookie to user
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    });
});

// ========
// local signup
// ========
passport.use('local-signup', new LocalStrategy({
  // by default, local strategy uses username and password
  // override it with email
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true // allows us to pass entire request to callback
},
(req, email, password, done) => {
  // asynchronous
  // User.findOne wont fire unless data is sent callback
  process.nextTick(() => {
    //check to see if user already exists
    User.findOne({ 'local.email' : email }, (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, false,
          req.flash('signupMessage', 'That email is already exists.'));
      } else {
        // if there's no user with the email, create one
        const newUser = new User();

        // set the user's local credentials
        newUser.local.email = email;
        newUser.local.password = newUser.generateHash(password);

        // save the user
        newUser.save(function(err) {
          if (err) throw (err);
          return done(null, newUser);
        });
      }
    });
  });
}));

// =====
// LOCAL LOGIN
// =====
passport.use('local-login', new LocalStrategy({
  // by default, local strategy uses username and password,
  // we override that with email
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true // allows us to pass the entire request to the callback
},
(req, email, password, done) => { // callback with email and password from our form
  // check to see if the user trying to login already exists
  User.findOne({ 'local.email' : email }, (err, user) => {
    if (err) return done(err);
    // if no user is found, return the message
    if (!user)
    // use req.flash to set flash data using connect-flash
      return done(null, false, req.flash('loginmessage', 'No user found'));

    // if the user is found but the password is wrong
    if (!user.validPassword(password))
      return done(null, false, req.flash('loginMessage', 'Oops! Wrond password.'));

    // if all goes correctly, return successful user
    return done(null, user);
  });
}));

// use passport to handle new instance
// of google strategy
passport.use(new GoogleStrategy({
  //google developer Client ID and secret
  clientID: keys.googleClientID,
  clientSecret: keys.googleClientSecret,
  // route user is sent to after being granted
  // permission to our application
  callbackURL: '/auth/google/callback'
},
  //console log the token gotten from the google callback
  (accessToken, refreshToken, profile, done) => {
    // check if user already exists
    User.findOne({ 'google.googleId' : profile.id })
      .then((existingUser) => {
        if (existingUser) {
          // we already have a record with the given profile ID
          done(null, existingUser);
        } else {
          // we don't have a user record with this ID, make a new record
          // create new instance of User model class
          new User ({ 'google.googleId' : profile.id,
            'google.email' : profile.emails[0].value,
            'google.name' : profile.displayName })
          // save new user to the database
            .save()
            .then(user => done(null, user));
        }
      });


  }
));
