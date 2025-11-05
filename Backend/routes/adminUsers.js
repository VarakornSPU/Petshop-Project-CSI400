// Backend/routes/adminUsers.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../utils/rbac.js';
import pool from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';

const router = express.Router();

// ==========================================
// ✅ GET ALL USERS (with Soft Delete Filter)
// ==========================================
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', includeDeleted = 'false' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT id, email, first_name, last_name, phone, role, is_banned, is_deleted, 
             deleted_at, created_at, updated_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter deleted accounts
    if (includeDeleted !== 'true') {
      query += ` AND is_deleted = FALSE`;
    }

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
    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1 ${includeDeleted !== 'true' ? 'AND is_deleted = FALSE' : ''} ${search ? `AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)` : ''} ${role ? `AND role = $${search ? 2 : 1}` : ''}`;
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

// ==========================================
// ✅ GET SINGLE USER BY ID
// ==========================================
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, is_banned, is_deleted,
              deleted_at, deleted_reason, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Get user's order summary
    const orderSummary = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('pending', 'confirmed', 'processing', 'shipping') THEN 1 END) as active_orders,
        SUM(total) as total_spent
       FROM orders WHERE user_id = $1`,
      [id]
    );

    res.json({
      user: result.rows[0],
      orderSummary: orderSummary.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', details: error.message });
  }
});

// ==========================================
// ✅ CREATE NEW USER (Admin)
// ==========================================
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
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND is_deleted = FALSE', 
      [email]
    );
    
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

    await logAudit({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_CREATED_BY_ADMIN,
      details: { createdUserId: result.rows[0].id, email },
      req
    });

    res.status(201).json({
      message: 'สร้างผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้', details: error.message });
  }
});

// ==========================================
// ✅ UPDATE USER (Admin)
// ==========================================
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
       SET first_name = $1, last_name = $2, phone = $3, role = $4
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role, updated_at`,
      [firstName, lastName, phone || null, role, id]
    );

    await logAudit({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_UPDATED_BY_ADMIN,
      details: { updatedUserId: id, changes: { firstName, lastName, phone, role } },
      req
    });

    res.json({
      message: 'อัปเดตผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้', details: error.message });
  }
});

// ==========================================
// ✅ DELETE USER (Admin) - with Active Order Check
// ==========================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    }

    await client.query('BEGIN');

    // Check if user exists
    const checkUser = await client.query(
      'SELECT id, email, first_name FROM users WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (checkUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ หรือถูกลบไปแล้ว' });
    }

    // ✅ Check for Active Orders
    const activeOrdersResult = await client.query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE user_id = $1 
       AND status IN ('pending', 'confirmed', 'processing', 'shipping')`,
      [id]
    );

    const activeOrderCount = parseInt(activeOrdersResult.rows[0].count);

    if (activeOrderCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'ไม่สามารถลบผู้ใช้ได้',
        message: `ผู้ใช้นี้มีคำสั่งซื้อที่กำลังดำเนินการอยู่ ${activeOrderCount} รายการ`,
        details: { activeOrders: activeOrderCount }
      });
    }

    // Soft Delete user
    await client.query(
      `UPDATE users 
       SET is_deleted = TRUE, 
           deleted_at = NOW(),
           deleted_reason = 'Deleted by admin',
           email = CONCAT('deleted_', id, '_', email)
       WHERE id = $1`,
      [id]
    );

    // Soft Delete addresses
    await client.query(
      'UPDATE addresses SET is_deleted = TRUE WHERE user_id = $1',
      [id]
    );

    // Revoke tokens
    await client.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [id]
    );

    await client.query('COMMIT');

    await logAudit({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_DELETED_BY_ADMIN,
      details: { 
        deletedUserId: id, 
        email: checkUser.rows[0].email,
        name: checkUser.rows[0].first_name 
      },
      req
    });

    res.json({ message: 'ลบผู้ใช้สำเร็จ (Soft Delete)' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้', details: error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// ✅ BAN/UNBAN USER (Admin)
// ==========================================
router.post('/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    // Prevent banning own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถแบนบัญชีของตัวเองได้' });
    }

    // Check if user exists
    const checkUser = await pool.query(
      'SELECT id, email FROM users WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Update ban status
    const result = await pool.query(
      `UPDATE users SET is_banned = $1 WHERE id = $2
       RETURNING id, email, first_name, last_name, is_banned`,
      [isBanned, id]
    );

    // Revoke tokens if banning
    if (isBanned) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
        [id]
      );
    }

    await logAudit({
      userId: req.user.id,
      action: isBanned ? AUDIT_ACTIONS.ACCOUNT_BANNED : AUDIT_ACTIONS.ACCOUNT_UNBANNED,
      details: { 
        targetUserId: id, 
        email: checkUser.rows[0].email 
      },
      req
    });

    res.json({
      message: isBanned ? 'แบนผู้ใช้สำเร็จ' : 'ยกเลิกแบนผู้ใช้สำเร็จ',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแบนผู้ใช้', details: error.message });
  }
});

// ==========================================
// ✅ RESET USER PASSWORD (Admin)
// ==========================================
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
    const checkUser = await pool.query(
      'SELECT id, email FROM users WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    // Revoke all tokens
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'admin_reset_user_password',
      details: { 
        targetUserId: id, 
        email: checkUser.rows[0].email 
      },
      req
    });

    res.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', details: error.message });
  }
});

router.get('/:id/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, action, details, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      logs: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;