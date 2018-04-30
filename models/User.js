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
    email : String,
    password : String
  },
  // require unique google ID property, as string
  googleId: String
});

// generating a hash
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = (password) => {
  return bcrypt.compareSync(password, this.local.password);
};

// create user class
// first argument is the name of the collection
// second argument is the name of the schema
mongoose.model('users', userSchema);
