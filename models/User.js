//import mongoose library
const mongoose = require('mongoose');

//import bcrypt for hashing passwords
const bcrypt = require('bcrypt-nodejs');

// use schema to create object
// that will describe all the different properties
// that every collection will have
const { Schema } = mongoose;

// create schema for users collection
const userSchema = new Schema({

  local : {
    email : { type : String, unique : true , lowercase : true },
    name: String,
    password : String,
    username : String,
    // require unique google ID property, as string
    googleId : String,
    profilePicture : String
  }
});


// generating a hash
userSchema.pre('save', function (next) {
  const user = Object.assign(this);

  bcrypt.genSalt(10, function (err, salt) {
    if (err) { return next(err); }

    bcrypt.hash(user.local.password, salt, null, function (err, hash) {
      if (err) { return next(err); }

      user.local.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.local.password, function (err, isMatch) {
    if (err) { return callback(err); }
    callback(null, isMatch);
  });
}


// create user class
// first argument is the name of the collection
// second argument is the name of the schema
mongoose.model('users', userSchema);
