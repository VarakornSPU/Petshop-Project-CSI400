// Backend/routes/address.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

//  VALIDATION RULES
const addressValidationRules = [
  body('recipientName').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้รับ'),
  body('phone').trim().notEmpty().withMessage('กรุณากรอกเบอร์โทรศัพท์'),
  body('addressLine1').trim().notEmpty().withMessage('กรุณากรอกที่อยู่'),
  body('subdistrict').trim().notEmpty().withMessage('กรุณากรอกตำบล/แขวง'),
  body('district').trim().notEmpty().withMessage('กรุณากรอกอำเภอ/เขต'),
  body('province').trim().notEmpty().withMessage('กรุณากรอกจังหวัด'),
  body('postalCode').trim().matches(/^[0-9]{5}$/).withMessage('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
  body('addressLine2').optional().trim(),
  body('isDefault').isBoolean().optional()
];

// GET ALL ADDRESSES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, recipient_name, phone, address_line1, address_line2,
              subdistrict, district, province, postal_code, is_default,
              created_at, updated_at
       FROM addresses 
       WHERE user_id = $1 AND is_deleted = FALSE 
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลที่อยู่ได้' });
  }
});

//  CREATE NEW ADDRESS
router.post('/', authenticateToken, addressValidationRules, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { recipientName, phone, addressLine1, addressLine2, subdistrict, 
            district, province, postalCode, isDefault } = req.body;

    await client.query('BEGIN');

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses (
        user_id, recipient_name, phone, address_line1, address_line2,
        subdistrict, district, province, postal_code, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [req.user.id, recipientName, phone, addressLine1, addressLine2 || '',
       subdistrict, district, province, postalCode, isDefault || false]
    );

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างที่อยู่ได้' });
  } finally {
    client.release();
  }
});

//  UPDATE ADDRESS
router.put('/:id', authenticateToken, addressValidationRules, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { recipientName, phone, addressLine1, addressLine2, subdistrict,
            district, province, postalCode, isDefault } = req.body;

    await client.query('BEGIN');

    // Check ownership
    const checkResult = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์แก้ไข' });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND id != $2',
        [req.user.id, id]
      );
    }

    const result = await client.query(
      `UPDATE addresses SET 
        recipient_name = $1, phone = $2, address_line1 = $3, address_line2 = $4,
        subdistrict = $5, district = $6, province = $7, postal_code = $8, 
        is_default = $9
       WHERE id = $10 AND user_id = $11 
       RETURNING *`,
      [recipientName, phone, addressLine1, addressLine2 || '', subdistrict,
       district, province, postalCode, isDefault || false, id, req.user.id]
    );

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตที่อยู่ได้' });
  } finally {
    client.release();
  }
});

// SET DEFAULT ADDRESS
router.put('/:id/default', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check ownership
    const checkResult = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์ตั้งเป็นค่าเริ่มต้น' });
    }

    // Unset all default addresses for user
    await client.query(
      'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
      [req.user.id]
    );

    // Set this address as default
    const result = await client.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'ไม่สามารถตั้งเป็นที่อยู่เริ่มต้นได้' });
  } finally {
    client.release();
  }
});

//  DELETE ADDRESS (with Active Order Check)
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');

    // Check ownership
    const addressResult = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE',
      [id, req.user.id]
    );

    if (addressResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์ลบ' });
    }

    // ✅ CHECK IF ADDRESS IS USED IN ACTIVE ORDERS
    // Only check orders by comparing the stored shipping address snapshot
    // to the address being deleted. The project does not include a
    // separate order_addresses join table in the schema, so referencing
    // it caused SQL errors on Windows (table not found). Keep the check
    // to the order snapshot columns which are guaranteed to exist.
    const activeOrdersResult = await client.query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE user_id = $1 
       AND status IN ('pending', 'confirmed', 'processing', 'shipping')
       AND shipping_address_line1 = (SELECT address_line1 FROM addresses WHERE id = $2)`,
      [req.user.id, id]
    );

    const activeOrderCount = parseInt(activeOrdersResult.rows[0].count);

    if (activeOrderCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'ไม่สามารถลบที่อยู่ได้',
        message: `ที่อยู่นี้ถูกใช้ในคำสั่งซื้อที่กำลังดำเนินการอยู่ ${activeOrderCount} รายการ`,
        details: {
          activeOrders: activeOrderCount
        }
      });
    }

    // Soft delete the address
    await client.query(
      'UPDATE addresses SET is_deleted = TRUE WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'ไม่สามารถลบที่อยู่ได้' });
  } finally {
    client.release();
  }
});

//  GET ADDRESS USAGE INFO (for UI)
router.get('/:id/usage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const addressResult = await pool.query(
      'SELECT id, recipient_name FROM addresses WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (addressResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบที่อยู่' });
    }

    // Count active orders using this address
    const usageResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status IN ('pending', 'confirmed', 'processing', 'shipping') THEN 1 END) as active_orders,
        COUNT(*) as total_orders
       FROM orders
       WHERE user_id = $1
       AND shipping_address_line1 = (SELECT address_line1 FROM addresses WHERE id = $2)`,
      [req.user.id, id]
    );

    res.json({
      addressId: id,
      recipientName: addressResult.rows[0].recipient_name,
      usage: {
        activeOrders: parseInt(usageResult.rows[0].active_orders),
        totalOrders: parseInt(usageResult.rows[0].total_orders),
        canDelete: parseInt(usageResult.rows[0].active_orders) === 0
      }
    });

  } catch (error) {
    console.error('Error fetching address usage:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการใช้งานได้' });
  }
});

export default router;