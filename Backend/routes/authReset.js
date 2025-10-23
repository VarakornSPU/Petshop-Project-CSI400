// Backend/routes/authReset.js
import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TOKEN_EXP_MIN = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60', 10);

// helper: create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true ถ้าใช้ 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(200).json({ ok: true }); // ไม่ยืนยันว่ามี user (prevents enumeration)

    const user = rows[0];
    // สร้าง token แบบสุ่มและเก็บ hash ใน DB
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [tokenHash, expires, user.id]
    );

    // สร้างลิงก์รีเซ็ต
    const resetUrl = `${process.env.APP_URL.replace(/\/$/, '')}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // ส่งอีเมล
    const mailOptions = {
      from: `"No Reply" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password reset',
      html: `
        <p>คุณได้รับคำขอรีเซ็ตรหัสผ่าน หากไม่ได้ร้องขอ กรุณาเพิกเฉย</p>
        <p><a href="${resetUrl}">คลิกที่นี่เพื่อรีเซ็ตรหัสผ่าน</a></p>
        <p>ลิงก์จะหมดอายุใน ${TOKEN_EXP_MIN} นาที</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) return res.status(400).json({ ok:false, message: 'Missing fields' });

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT id, reset_expires FROM users WHERE email = ? AND reset_token = ? LIMIT 1',
      [email, tokenHash]
    );
    if (!rows.length) return res.status(400).json({ ok:false, message: 'Invalid or expired token' });

    const user = rows[0];
    if (new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ ok:false, message: 'Token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashed, user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, message: 'Server error' });
  }
});

export default router;
