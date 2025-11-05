// Backend/routes/userAccount.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import { comparePassword } from '../utils/password.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();


router.post('/delete-request', authenticateToken, [
  body('password').notEmpty().withMessage('กรุณาใส่รหัสผ่านเพื่อยืนยัน'),
  body('reason').optional().trim()
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors.array() });
    }

    const { password, reason } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // 1. Verify Password
    const userResult = await client.query(
      'SELECT password_hash, email, first_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const user = userResult.rows[0];
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      await client.query('ROLLBACK');
      await logAudit({ 
        userId, 
        action: 'delete_account_failed', 
        details: { reason: 'wrong_password' }, 
        req 
      });
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // 2. Check for Active Orders
    const activeOrdersResult = await client.query(
      `SELECT COUNT(*) as count, 
              array_agg(order_number) as order_numbers
       FROM orders 
       WHERE user_id = $1 
       AND status IN ('pending', 'confirmed', 'processing', 'shipping')`,
      [userId]
    );

    const activeOrderCount = parseInt(activeOrdersResult.rows[0].count);
    const orderNumbers = activeOrdersResult.rows[0].order_numbers;

    if (activeOrderCount > 0) {
      await client.query('ROLLBACK');
      
      await logAudit({ 
        userId, 
        action: 'delete_account_blocked', 
        details: { 
          reason: 'active_orders',
          activeOrders: activeOrderCount,
          orderNumbers 
        }, 
        req 
      });

      return res.status(400).json({ 
        error: 'ไม่สามารถลบบัญชีได้',
        message: 'คุณมีคำสั่งซื้อที่กำลังดำเนินการอยู่',
        details: {
          activeOrders: activeOrderCount,
          orderNumbers,
          instruction: 'กรุณารอให้คำสั่งซื้อเสร็จสมบูรณ์ก่อนลบบัญชี'
        }
      });
    }

    // 3. Soft Delete User Account
    await client.query(
      `UPDATE users 
       SET is_deleted = TRUE, 
           deleted_at = NOW(),
           deleted_reason = $1,
           email = CONCAT('deleted_', id, '_', email)
       WHERE id = $2`,
      [reason || 'User requested account deletion', userId]
    );

    // 4. Soft Delete All User Addresses
    await client.query(
      'UPDATE addresses SET is_deleted = TRUE WHERE user_id = $1',
      [userId]
    );
    // 5. Revoke All Refresh Tokens
    await client.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    // 6. Log Audit
    await logAudit({ 
      userId, 
      action: 'account_deleted', 
      details: { 
        email: user.email,
        name: user.first_name,
        reason: reason || 'User requested'
      }, 
      req 
    });

    res.json({ 
      message: 'ลบบัญชีสำเร็จ',
      details: {
        email: user.email,
        deletedAt: new Date().toISOString(),
        note: 'ข้อมูลของคุณจะถูกเก็บไว้ในระบบเพื่อการอ้างอิง แต่ไม่สามารถเข้าสู่ระบบได้อีก'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบบัญชี' });
  } finally {
    client.release();
  }
});


router.get('/can-delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check active orders
    const result = await pool.query(
      `SELECT 
        COUNT(*) as active_orders,
        array_agg(order_number) FILTER (WHERE status IN ('pending', 'confirmed', 'processing', 'shipping')) as active_order_numbers,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders
       FROM orders 
       WHERE user_id = $1`,
      [userId]
    );

    const activeOrders = parseInt(result.rows[0].active_orders);
    const orderNumbers = result.rows[0].active_order_numbers || [];
    const completedOrders = parseInt(result.rows[0].completed_orders);

    const canDelete = activeOrders === 0;

    res.json({
      canDelete,
      activeOrders,
      completedOrders,
      orderNumbers,
      message: canDelete 
        ? 'คุณสามารถลบบัญชีได้' 
        : `มีคำสั่งซื้อที่กำลังดำเนินการอยู่ ${activeOrders} รายการ`,
      warning: !canDelete 
        ? 'กรุณารอให้คำสั่งซื้อเสร็จสมบูรณ์ก่อนลบบัญชี'
        : null
    });

  } catch (error) {
    console.error('Check delete eligibility error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ' });
  }
});


router.post('/restore/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
    }

    const { userId } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET is_deleted = FALSE,
           deleted_at = NULL,
           deleted_reason = NULL,
           email = REGEXP_REPLACE(email, '^deleted_[0-9]+_', '')
       WHERE id = $1 AND is_deleted = TRUE
       RETURNING id, email, first_name, last_name`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบบัญชีที่ถูกลบ' });
    }

    await logAudit({ 
      userId: req.user.id, 
      action: 'account_restored', 
      details: { 
        restoredUserId: userId,
        restoredEmail: result.rows[0].email 
      }, 
      req 
    });

    res.json({ 
      message: 'กู้คืนบัญชีสำเร็จ',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Restore account error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการกู้คืนบัญชี' });
  }
});

export default router;