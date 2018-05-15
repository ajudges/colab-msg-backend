
// import jwt library
const jwt = require('jwt-simple');
// import keys file
const keys = require('../config/keys');

// import mongoose library
const mongoose = require('mongoose');
const User = mongoose.model('users');
const bcrypt = require('bcrypt-nodejs');


require('../models/User');


// create a fnctoin to take a user's id and
// encode it with our secret
tokenForUser = user => {
  const timestamp = new Date().getTime();
  // iat = issued at time ... convention of jwt
  // first argument is the object we want to encode
  // second argument is the secret to use to encrypt it
  return jwt.encode({ sub: user.id, iat: timestamp }, keys.localSecret);
}

exports.signin = (req, res, next) => {
  // User has already had their email and password auth'd
  // we just need to give them a token
  res.send({ token : tokenForUser(req.user) });
}

exports.signup = (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const username = req.body.username;

  if (!email || !password||!username) {
    return res.status(422).send({ error : 'Provide email, password and username'});
  }
  // see if a user with the given user exist
  User.findOne({'local.email' : email}, (err, existingUser) => {
    if (err) { return next (err);}

  // if a user exist, return an error
  if (existingUser) {
    return res.status(422).send({ error : 'Email is in use'});
  }

  // if user doesnt exist but identical username exist
  // inform to change username
  if (User.findOne({'local.username' : username })) {
    return res.status(422).send({ error : 'Username is in use'})
  }

  // if a user doesnt exist, create and save a record
  // generating a hash
  user = new User ({
    'local.email' : email,
    'local.password' : password,
    'local.name' : name,
    'local.username' : username,
    'local.profilePicture' : ''
  });


  user.save((err) => {
    if (err) { return next (err); }


  // respond to request indicating user created
  res.json({ token : tokenForUser(user) });
  });

  });



}
