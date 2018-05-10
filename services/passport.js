// import passport to handle user authentications
const passport = require('passport');


//import google strategy module for authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// import mongoose library
const mongoose = require('mongoose');


// import connect-flash library to flash messages
const flash = require('connect-flash');


// import keys file
const keys = require('../config/keys');

// pull a model out of mongoose by giving
// a single argument
const User = mongoose.model('users');

const Authentication = require('../controllers/authentication');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');

// create local strategy
const LocalOptions = { usernameField : 'email' };
const localLogin = new LocalStrategy(LocalOptions, (email, password, done) => {
  // Verify this username and password, call done with the user
  // if it is the current username and password
  // otherwise, call done with false
  User.findOne({ 'local.email' : email }, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done (null, false); }

    // compare passwords - is 'password' equal to user.local.password?
    user.comparePassword(password, (err, isMatch) => {
      if (err) { return done (err); }
      if (!isMatch) { return done (null, false); }

      return done(null, user);
    })
  })
})


// setup options for JWT Strategy
const jwtOptions = {
  jwtFromRequest : ExtractJwt.fromHeader('authorization'),
  secretOrKey : keys.localSecret
};


// Create JWT strategy
// payload is the decoded jwt token
const jwtLogin = new JwtStrategy (jwtOptions, (payload, done) => {
  // See if the user id in the payload exists in our database
  User.findById(payload.sub, (err, user) => {
    if (err) { return done(err, false); }

  // if it does, call done with that user
  if (user) {
    done (null, user);
  }
  // otherwise call done without a user object
  else {
    done(null, false);
  }
});
});

// Tell passport to use this Strategy
passport.use(jwtLogin);
passport.use(localLogin);

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
      .then((existingUser) => { (req, res) => {
        if (existingUser) {
          // we already have a record with the given profile ID
          done(null, existingUser);
          //res.json({ token : Authentication.tokenForUser(req.user)});
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
      }

      });


  }
));
