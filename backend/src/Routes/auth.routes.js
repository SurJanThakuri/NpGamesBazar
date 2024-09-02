// routes/auth.routes.js
import express from 'express';
import passport from '../Utils/passport.js'; 

const router = express.Router();

// Route to initiate Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to the desired route
    res.redirect('/dashboard'); // Adjust the redirect path as per your app's requirement
  }
);

// Route to logout user
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/'); // Redirect to home or login page after logout
});

export default router;
