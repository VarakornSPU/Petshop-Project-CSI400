// Backend/middleware/auth.js (FIXED)
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const authenticateToken = async (req, res, next) => {
  try {
    // ✅ 1. Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Auth Middleware - Path:', req.path);
    console.log('📨 Auth Header:', authHeader ? 'EXISTS' : 'MISSING');
    console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');

    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    // ✅ 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token decoded:', { userId: decoded.userId, email: decoded.email, role: decoded.role });
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    // ✅ 3. Check if user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, first_name, last_name, is_deleted, is_banned FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      console.error('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    const user = userResult.rows[0];

    // ✅ 4. Check if user is deleted
    if (user.is_deleted) {
      console.error('❌ User account is deleted');
      return res.status(401).json({ error: 'Account has been deleted' });
    }

    // ✅ 5. Check if user is banned
    if (user.is_banned) {
      console.error('❌ User account is banned');
      return res.status(403).json({ error: 'Account has been banned' });
    }

    // ✅ 6. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };

    console.log('✅ User authenticated:', req.user.email, '(Role:', req.user.role + ')');
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateToken = (userId, email, role) => {
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  
  console.log('🔐 Token generated for user:', email);
  return token;
};

export const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  
  console.log('🔄 Refresh token generated for userId:', userId);
  return token;
};

export default { authenticateToken, generateToken, generateRefreshToken };