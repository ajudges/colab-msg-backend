//import passport library
const passport = require('passport');

// import nodemailer module to send emails
const nodemailer = require('nodemailer');

// import unique ID generator
const uniqid = require('uniqid');

// middleware for checking logged in user
isLoggedIn = (req, res, next) => {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they arent authenticated redirect to homepage
  res.redirect('/auth/google');
}



// create and export an arrow
// function with the app object
module.exports = app => {
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

  //log out
  app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //generate invitation ID
  app.get('/api/invite', isLoggedIn, (req, res) => {
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
        }
      });
    });
  })

  // let passport authenticate the user profile with google strategy
  // with the code in the callback url
  app.get('/auth/google/callback', passport.authenticate('google'));

  // process the sign up form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to profile homepage
    failureRedirect : '/signup', // redirect back to signup page
    failureFlash : true // allow flash messages
  }));

  // process the sign up form
  app.post('/login', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to profile homepage
    failureRedirect : '/login', // redirect back to login page
    failureFlash : true // allow flash messages
  }));

  //testing to get current_user
  app.get('/api/current_user', isLoggedIn, (req, res) => {
    res.send(req.user);
  });

};
