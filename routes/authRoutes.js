//import passport library
const passport = require('passport');

// import connect-flash library to flash messages
const flash = require('connect-flash');

require('../services/passport');

const bodyParser = require('body-parser');

//const jwt = require('jsonwebtoken');

// import keys file
const keys = require('../config/keys');

// import nodemailer module to send emails
const nodemailer = require('nodemailer');

// import cloudinary for avatar hosting
const cloudinary = require('cloudinary');

// import multer middleware for uploading images
const multer = require('multer');

// import unique ID generator
const uniqid = require('uniqid');

const Authentication = require('../controllers/authentication');
require('../controllers/authentication');

//upload profile picture to multer local storage
const upload = multer({ dest: './profilepics'});

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

  app.get('/api/current_user', requireAuth, (req, res) => {
    res.send(req.user);
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

  app.post('/imageUpload', upload.single('file'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, { public_id : 'lol' }, function (req, res) {
      res.json({ profile: res.url });
    })
  });


  app.post('/signin', requireSignin, Authentication.signin);

  // process the sign up form
  app.post('/signup', Authentication.signup);


  //log out
  app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //generate invitation ID
  app.get('/api/invite', requireAuth, (req, res) => {
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
        from : '"'+req.user.google.name+'"' + ' <'+req.user.google.email + '>', //sender address
        to : 'esiotltd@gmail.com', //receiver(s) address
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
