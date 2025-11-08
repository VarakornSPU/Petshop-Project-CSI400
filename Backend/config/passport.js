import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Using pg Pool: pool.query returns { rows }
        // 1) Try to find user by google_id
        const existingByGoogle = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );

        if (existingByGoogle.rows && existingByGoogle.rows.length) {
          return done(null, existingByGoogle.rows[0]);
        }

        // 2) If no google_id, try to find by email to link accounts
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          const existingByEmail = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          if (existingByEmail.rows && existingByEmail.rows.length) {
            // Link existing account with google_id
            const user = existingByEmail.rows[0];
            await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [profile.id, user.id]);
            const updated = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
            return done(null, updated.rows[0]);
          }
        }

        // 3) Create new user. Map Google profile fields to our users table (first_name, last_name)
        const firstName = profile.name?.givenName || profile.displayName || '';
        const lastName = profile.name?.familyName || '';

        const insertRes = await pool.query(
          `INSERT INTO users (google_id, email, first_name, last_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [profile.id, email, firstName, lastName, 'customer']
        );

        done(null, insertRes.rows[0]);
      } catch (error) {
        // Log error for debugging and pass to Passport
        console.error('GoogleStrategy error:', error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, res.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;