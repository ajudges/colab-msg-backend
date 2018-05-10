//import passport library
const passport = require('passport');

// import connect-flash library to flash messages
const flash = require('connect-flash');

require('../services/passport');

//const jwt = require('jsonwebtoken');

// import nodemailer module to send emails
const nodemailer = require('nodemailer');

// import unique ID generator
const uniqid = require('uniqid');

const Authentication = require('../controllers/authentication');

// middleware for checking logged in user
isLoggedIn = (req, res, next) => {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they arent authenticated redirect to homepage
  res.redirect('/auth/google');
}

const requireAuth = passport.authenticate('jwt', { session : false });
const requireSignin = passport.authenticate('local', { session : false });

// create and export an arrow
// function with the app object
module.exports = app => {

  app.get('/', requireAuth, (req, res) => {
    res.send(req.user);
  });

/*
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
  */

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
      let clientUrl = 'https://localhost:5000/invite/'+shortID;
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

/*
  // let passport authenticate the user profile with google strategy
  // with the code in the callback url
  app.get('/auth/google/callback', passport.authenticate('google', {
    //successRedirect : '/',
    failureRedirect : '/',
    session : false
    }),
    function (req, res) {
      let token = Authentication.tokenForUser(req.user);
      res.redirect("/api?token="+token);
    }
      );
      */

  /*app.post('/signup', passport.authenticate('localsignup')
);*/

/*
  // process the login up form
  app.get('/login', (req, res, next) => {
    passport.authenticate('local', {session:false}, (err, user,
      info) => {
        if (err||!user) {
          return res.status(400).json({
            message : 'Some is not right',
            user : user
          });
        }
        req.login(user, {session : false}, (err) => {
          if (err) {
            res.send(err);
          }

          // generate a signed json web token with the contents of
          // user object and return it in the response

          const token = jwt.sign(user, 'your_jwt_secret');
          return res.json({user, token});
        });
      })(req,res);
  });
*/
  //testing to get current_user
  app.get('/api/current_user', isLoggedIn, (req, res) => {
    res.send(req.user);
  });

};
