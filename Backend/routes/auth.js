// Backend/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import pool from '../config/db.js';
import crypto from 'crypto';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { authenticateToken, generateToken, generateRefreshToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts, please try again later' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many password reset attempts' }
});

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง'),
  body('password').isLength({ min: 8 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่ชื่อ'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่นามสกุล'),
  body('phone').optional().isMobilePhone('th-TH').withMessage('กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง'),
  
  // Address Validation (Required on Registration)
  body('address.recipientName').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้รับ'),
  body('address.phone').trim().notEmpty().withMessage('กรุณากรอกเบอร์โทรศัพท์'),
  body('address.addressLine1').trim().notEmpty().withMessage('กรุณากรอกที่อยู่'),
  body('address.subdistrict').trim().notEmpty().withMessage('กรุณากรอกตำบล/แขวง'),
  body('address.district').trim().notEmpty().withMessage('กรุณากรอกอำเภอ/เขต'),
  body('address.province').trim().notEmpty().withMessage('กรุณากรอกจังหวัด'),
  body('address.postalCode').trim().matches(/^[0-9]{5}$/).withMessage('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง'),
  body('password').notEmpty().withMessage('กรุณาใส่รหัสผ่าน')
];

router.post('/register', authLimiter, registerValidation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: errors.array() 
      });
    }

    const { email, password, firstName, lastName, phone, address } = req.body;

    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    await client.query('BEGIN');

    // Check existing user
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND is_deleted = FALSE',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    // Check phone if provided
    if (phone) {
      const existingPhone = await client.query(
        'SELECT id FROM users WHERE phone = $1 AND is_deleted = FALSE',
        [phone]
      );
      if (existingPhone.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, last_login) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, hashedPassword, firstName, lastName, phone, 'customer']
    );

    const newUser = userResult.rows[0];

    // Create default address
    await client.query(
      `INSERT INTO addresses (
        user_id, recipient_name, phone, address_line1, address_line2,
        subdistrict, district, province, postal_code, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
      [
        newUser.id,
        address.recipientName,
        address.phone,
        address.addressLine1,
        address.addressLine2 || '',
        address.subdistrict,
        address.district,
        address.province,
        address.postalCode
      ]
    );

    // Generate tokens
    const accessToken = generateToken(newUser.id, newUser.email, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id);

    // Save refresh token
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [newUser.id, refreshToken, refreshExpiry]
    );

    await client.query('COMMIT');

    // Log audit
    await logAudit({
      userId: newUser.id,
      action: 'register',
      details: { email: newUser.email },
      req
    });

    // Send welcome email
    sendWelcomeEmail(email, firstName).catch(err => 
      console.error('Welcome email failed:', err)
    );

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        role: newUser.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  } finally {
    client.release();
  }
});

router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find active user
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, phone, role, is_banned, is_deleted 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      await logAudit({ action: 'login_failed', details: { email, reason: 'user_not_found' }, req });
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = result.rows[0];

    // Check if user is deleted
    if (user.is_deleted) {
      await logAudit({ userId: user.id, action: 'login_failed', details: { reason: 'deleted_account' }, req });
      return res.status(401).json({ error: 'บัญชีนี้ถูกปิดการใช้งานแล้ว' });
    }

    // Check if banned
    if (user.is_banned) {
      await logAudit({ userId: user.id, action: 'login_failed', details: { reason: 'banned' }, req });
      return res.status(401).json({ error: 'บัญชีของคุณถูกระงับการใช้งาน' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      await logAudit({ userId: user.id, action: 'login_failed', details: { reason: 'wrong_password' }, req });
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const accessToken = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiry]
    );

    await logAudit({ userId: user.id, action: 'login', details: { email: user.email }, req });

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const tokenResult = await pool.query(
      `SELECT rt.user_id, rt.expires_at, rt.revoked, u.email, u.role, u.is_deleted, u.is_banned
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = tokenResult.rows[0];

    if (token.revoked) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    if (new Date(token.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    if (token.is_deleted || token.is_banned) {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Generate new access token
    const newAccessToken = generateToken(token.user_id, token.email, token.role);

    res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ LOGOUT ENDPOINT
// ==========================================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
        [refreshToken]
      );
    }

    await logAudit({ userId: req.user.id, action: 'logout', req });

    res.json({ message: 'ออกจากระบบสำเร็จ' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ FORGOT PASSWORD
// ==========================================
router.post('/forgot-password', resetLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'กรุณาใส่อีเมลที่ถูกต้อง' });
    }

    const { email } = req.body;

    const result = await pool.query(
      'SELECT id, email, first_name FROM users WHERE email = $1 AND is_deleted = FALSE',
      [email]
    );

    // Always return success to prevent enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ' });
    }

    const user = result.rows[0];

    // Generate a secure random token, store only its SHA256 hash in DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3',
      [resetTokenHash, resetTokenExpires, user.id]
    );

    await logAudit({ userId: user.id, action: 'password_reset_request', req });

    const emailResult = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailResult.success) {
      console.error('Password reset email failed:', emailResult.error);
      return res.status(500).json({ error: 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้' });
    }

    res.json({ message: 'เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ RESET PASSWORD
// ==========================================
router.post('/reset-password', authLimiter, [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
    }

  const { token, password } = req.body;

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    // Compare hashed token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token_hash = $1 AND reset_token_expires > NOW() AND is_deleted = FALSE',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'โทเค็นรีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    const user = result.rows[0];
    const hashedPassword = await hashPassword(password);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Revoke all refresh tokens for this user so existing sessions are invalidated
    try {
      await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [user.id]);
    } catch (revErr) {
      console.error('Failed to revoke refresh tokens after password reset:', revErr);
    }

    await logAudit({ userId: user.id, action: 'password_reset_success', req });

    res.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ VERIFY TOKEN
// ==========================================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});

// ==========================================
// ✅ GET PROFILE
// ==========================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, phone, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ UPDATE PROFILE
// ==========================================
router.put('/profile', authenticateToken, [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone('th-TH')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
    }

    const { firstName, lastName, phone } = req.body;

    if (phone) {
      const existingPhone = await pool.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, req.user.id]
      );
      if (existingPhone.rows.length > 0) {
        return res.status(400).json({ error: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3
       WHERE id = $4 
       RETURNING id, email, first_name, last_name, phone, role`,
      [firstName, lastName, phone, req.user.id]
    );

    await logAudit({ userId: req.user.id, action: 'profile_update', req });

    res.json({
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ==========================================
// ✅ CHANGE PASSWORD
// ==========================================
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
    }

    const { currentPassword, newPassword } = req.body;

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const isValidPassword = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Revoke all refresh tokens
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [req.user.id]
    );

    await logAudit({ userId: req.user.id, action: 'password_change', req });

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;