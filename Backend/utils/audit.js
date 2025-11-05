// Backend/utils/audit.js
import pool from '../config/db.js';

/**
 * บันทึก Audit Log เข้าฐานข้อมูล
 * @param {Object} options - ข้อมูลสำหรับบันทึก
 * @param {number} options.userId - ID ของผู้ใช้ (ถ้ามี)
 * @param {string} options.action - การกระทำ เช่น 'login', 'logout', 'register'
 * @param {Object} options.details - รายละเอียดเพิ่มเติม (JSON)
 * @param {Object} options.req - Express request object
 */
export const logAudit = async ({ userId, action, details = {}, req }) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId || null,
        action,
        JSON.stringify(details),
        ipAddress,
        userAgent
      ]
    );

    console.log(`[AUDIT] ${action} by user ${userId || 'anonymous'}`);
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

/**
 * ดึง Audit Logs ของผู้ใช้
 * @param {number} userId - ID ของผู้ใช้
 * @param {Object} options - ตัวเลือก
 * @param {number} options.limit - จำนวนที่ต้องการดึง
 * @param {number} options.offset - เริ่มต้นที่ตำแหน่ง
 * @param {string} options.action - Filter by action type
 */
export const getUserAuditLogs = async (userId, { limit = 50, offset = 0, action = null } = {}) => {
  try {
    let query = `
      SELECT id, action, details, ip_address, created_at
      FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [userId];

    if (action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
};

/**
 * ดึง Audit Logs ทั้งหมด (Admin only)
 */
export const getAllAuditLogs = async ({ limit = 100, offset = 0, action = null, userId = null } = {}) => {
  try {
    let query = `
      SELECT al.*, u.email, u.first_name, u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      params.push(action);
      query += ` AND al.action = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      query += ` AND al.user_id = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Failed to get all audit logs:', error);
    return [];
  }
};

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  REGISTER: 'register',
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  
  // Password
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  PASSWORD_CHANGE: 'password_change',
  
  // Account
  PROFILE_UPDATE: 'profile_update',
  ACCOUNT_DELETED: 'account_deleted',
  ACCOUNT_RESTORED: 'account_restored',
  ACCOUNT_BANNED: 'account_banned',
  ACCOUNT_UNBANNED: 'account_unbanned',
  
  // Address
  ADDRESS_CREATED: 'address_created',
  ADDRESS_UPDATED: 'address_updated',
  ADDRESS_DELETED: 'address_deleted',
  
  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Admin Actions
  USER_CREATED_BY_ADMIN: 'user_created_by_admin',
  USER_UPDATED_BY_ADMIN: 'user_updated_by_admin',
  USER_DELETED_BY_ADMIN: 'user_deleted_by_admin'
};

export default { logAudit, getUserAuditLogs, getAllAuditLogs, AUDIT_ACTIONS };