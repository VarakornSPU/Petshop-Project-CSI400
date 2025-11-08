import express from 'express';
import passport from 'passport';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Initiate Google OAuth login
router.get('/google', (req, res) => {
  // Build the Google OAuth2 authorization URL explicitly so the redirect_uri is
  // exactly the value we registered in Google Console (avoids redirect_uri_mismatch).
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';
  const scope = ['openid', 'email', 'profile'].join(' ');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('Redirecting to Google OAuth URL:', authUrl);
  res.redirect(authUrl);
});

// Google OAuth callback
// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google callback error (passport):', err);
      // Redirect to frontend with error for debugging
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?authError=server`);
    }

    if (!user) {
      console.warn('Google callback: no user returned by passport', info);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?authError=no_user`);
    }

    try {
      // Use existing generateToken utility so the token payload keys match the rest of the app
      const token = generateToken(user.id, user.email, user.role);

      // Redirect to frontend with token
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${encodeURIComponent(token)}`);
    } catch (signErr) {
      console.error('Token generation error:', signErr);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?authError=token`);
    }
  })(req, res, next);
});

export default router;