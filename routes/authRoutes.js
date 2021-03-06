
//import passport library
const passport = require('passport');

// import connect-flash library to flash messages
const flash = require('connect-flash');

require('../services/passport');

// import mongoose library
const mongoose = require('mongoose');
const User = mongoose.model('users');

const bodyParser = require('body-parser');
// create application/json parser
const jsonParser = bodyParser.json()

//const jwt = require('jsonwebtoken');

// import keys file
const keys = require('../config/keys');

// import nodemailer module to send emails
const nodemailer = require('nodemailer');

// import multer middleware for uploading images
const multer = require('multer');
//upload profile picture to multer local storage
const upload = multer({ dest: './profilepics', rename : (fieldname, filename) => {
  return filename = req.user.id;
} });


// import cloudinary for avatar hosting
const cloudinary = require('cloudinary');


// import unique ID generator
const uniqid = require('uniqid');

const Authentication = require('../controllers/authentication');
require('../controllers/authentication');


// configuring cloudinary
cloudinary.config({
  cloud_name: 'dfv8ccyvd',
  api_key: keys.cloudinaryKey,
  api_secret: keys.cloudinarySecret
});



const requireAuth = passport.authenticate('jwt', { session : false });
const requireSignin = passport.authenticate('local', { session : false });

// create and export an arrow
// function with the app object
module.exports = app => {

  app.post('/imageUpload', requireAuth, upload.single('file'), function (req, res, done) {
    cloudinary.v2.uploader.upload(req.file.path, { public_id : req.user.id }, function (error, result) {
      try {
        (User.updateOne({ _id : req.user.id}, { $set : {'local.profilePicture' : result.url}}))
          .then(null, done);
        res.send({ imageUpdate : 'Picture Update Completed'});
      } catch (e) {
        res.send(e);
      }
    });
    });

  app.get('/api/current_user', requireAuth, (req, res) => {
    res.send(req.user.local);
  });


  // route handler to kick user into authentication
  // flow with google strategy
  app.get(
    '/auth/google',
    //pass the google strategy into passport
    passport.authenticate('google', {
      //provide access to the user's profile and email
      scope: ['profile', 'email']
    })
  );

  app.post('/api/all_users', requireAuth, (req, res, next) => {
    User.find({}, { _id : 0,
      'local.email' : 1,
      'local.username' : 1
    }, (err, cursor) => {
        if (err) { return next (err);}
        else {res.json(cursor);}
      }
    )
  });

  app.post('/signin', jsonParser, requireSignin, Authentication.signin);

  // process the sign up form
  app.post('/signup', jsonParser,  Authentication.signup);


  //log out
  app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //generate invitation ID
  app.post('/api/invite', jsonParser, requireAuth, (req, res) => {
    const _to = req.body.emailInvite;
    // generate invitation ID
    let shortID = uniqid(req.user.id);
    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host : 'smtp.ethereal.email',
        port : 587,
        secure : false, //true for 465, false for other ports
        auth : {
          user : account.user, // generated ethereal user
          pass : account.pass // generated ethereal password
        }
      });
      let clientUrl = 'https://agile-mesa-76503.herokuapp.com/'+shortID;

      // setup email data
      let mailOptions = {
        from : '"'+req.user.local.name+'"' + ' <'+req.user.local.email+ '>', //sender address
        to : _to, //receiver(s) address
        subject : 'Invitation to CoLab Messenger', //subject line
        text : 'Hello, your invitation link is below ', //plain text
        html : clientUrl
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.send(error);
        }
        else {
          console.log('Message sent: %s', info.messageId);
          console.log('Preview url: %s', nodemailer.getTestMessageUrl(info));
          res.send(nodemailer.getTestMessageUrl(info));
        }
      });
    });
  })


  // let passport authenticate the user profile with google strategy
  // with the code in the callback url
  app.get('/auth/google/callback', passport.authenticate('google', {
    //successRedirect : '/',
    failureRedirect : '/',
    session : false
  }), (req, res)=> {
    res.json({ token : tokenForUser(req.user)});
  }
    );

};
