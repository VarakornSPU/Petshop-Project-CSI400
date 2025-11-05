// Backend/routes/profile.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import pool from '../config/db.js';

const router = express.Router();

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, phone, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    res.json({ user: result.rows[0] });
    console.log('User data from DB:', result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }onsole.log('User data from DB:', result.rows[0]);
});

// Update profile
router.put('/me', authenticateToken, [
  body('firstName').optional().trim().notEmpty().withMessage('กรุณาใส่ชื่อ'),
  body('lastName').optional().trim().notEmpty().withMessage('กรุณาใส่นามสกุล'),
  body('phone').optional().isMobilePhone('th-TH').withMessage('เบอร์โทรศัพท์ไม่ถูกต้อง')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
  }

  const { firstName, lastName, phone } = req.body;

  try {
    // Check if phone is already used by another user
    if (phone) {
      const phoneCheck = await pool.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, req.user.id]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, email, phone, first_name, last_name, role`,
      [firstName, lastName, phone, req.user.id]
    );

    res.json({ 
      message: 'อัปเดตข้อมูลสำเร็จ',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('กรุณาใส่รหัสผ่านปัจจุบัน'),
  body('newPassword').isLength({ min: 8 }).withMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  // Validate new password
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.message });
  }

  try {
    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // Hash and update new password
    const newHashedPassword = await hashPassword(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHashedPassword, req.user.id]
    );

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

export default router;