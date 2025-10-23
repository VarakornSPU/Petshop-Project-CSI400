// Backend/routes/adminUsers.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../utils/rbac.js';
import pool from '../config/db.js';
import { hashPassword } from '../utils/password.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT id, email, first_name, last_name, phone, role, is_banned, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      params.push(`%${search}%`);
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
    }

    // Role filter
    if (role) {
      paramCount++;
      params.push(role);
      query += ` AND role = $${paramCount}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1 ${search ? `AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)` : ''} ${role ? `AND role = $${search ? 2 : 1}` : ''}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(offset);
    query += ` ORDER BY created_at DESC LIMIT $${paramCount - 1} OFFSET $${paramCount}`;

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', details: error.message });
  }
});

// Get single user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, is_banned, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', details: error.message });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง'),
  body('password').isLength({ min: 8 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่ชื่อ'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่นามสกุล'),
  body('role').isIn(['customer', 'admin']).withMessage('กรุณาเลือก role ที่ถูกต้อง')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, phone, role, created_at`,
      [email, hashedPassword, firstName, lastName, phone || null, role]
    );

    res.status(201).json({
      message: 'สร้างผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้', details: error.message });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('firstName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่ชื่อ'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('กรุณาใส่นามสกุล'),
  body('role').isIn(['customer', 'admin']).withMessage('กรุณาเลือก role ที่ถูกต้อง')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, role } = req.body;

    // Check if user exists
    const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Update user
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, role = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role, updated_at`,
      [firstName, lastName, phone || null, role, id]
    );

    res.json({
      message: 'อัปเดตผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้', details: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    }

    // Check if user exists
    const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้', details: error.message });
  }
});

// Ban/Unban user (Admin only)
router.post('/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    // Prevent banning own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถแบนบัญชีของตัวเองได้' });
    }

    // Check if user exists
    const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Update ban status
    const result = await pool.query(
      `UPDATE users SET is_banned = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, first_name, last_name, is_banned`,
      [isBanned, id]
    );

    res.json({
      message: isBanned ? 'แบนผู้ใช้สำเร็จ' : 'ยกเลิกแบนผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแบนผู้ใช้', details: error.message });
  }
});

// Reset user password (Admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, [
  body('newPassword').isLength({ min: 8 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if user exists
    const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', details: error.message });
  }
});

export default router;