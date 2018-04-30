//import passport library
const passport = require('passport');

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

  // let passport authenticate the user profile with google strategy
  // with the code in the callback url
  app.get('/auth/google/callback', passport.authenticate('google'));

  //testing to get current_user
  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
};
