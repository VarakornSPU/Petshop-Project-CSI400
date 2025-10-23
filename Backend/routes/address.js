// Backend/routes/address.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Validation rules - updated to match frontend field names
const addressValidationRules = [
  body('recipientName').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้รับ'),
  body('phone').trim().notEmpty().withMessage('กรุณากรอกเบอร์โทรศัพท์'),
  body('addressLine1').trim().notEmpty().withMessage('กรุณากรอกที่อยู่'),
  body('subdistrict').trim().notEmpty().withMessage('กรุณากรอกตำบล/แขวง'),
  body('district').trim().notEmpty().withMessage('กรุณากรอกอำเภอ/เขต'),
  body('province').trim().notEmpty().withMessage('กรุณากรอกจังหวัด'),
  body('postalCode').trim().notEmpty().withMessage('กรุณากรอกรหัสไปรษณีย์')
    .matches(/^[0-9]{5}$/).withMessage('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
  body('addressLine2').optional().trim(),
  body('isDefault').isBoolean().optional()
];

// Transform frontend data to database format
const transformToDbFormat = (data) => {
  const fullAddress = data.addressLine2 
    ? `${data.addressLine1} ${data.addressLine2}` 
    : data.addressLine1;
  
  return {
    name: data.recipientName,
    phone: data.phone,
    address: fullAddress,
    district: data.district,
    province: data.province,
    postal_code: data.postalCode,
    is_default: data.isDefault || false
  };
};

// Transform database data to frontend format
const transformToFrontendFormat = (dbRow) => {
  return {
    id: dbRow.id,
    recipient_name: dbRow.name,
    phone: dbRow.phone,
    address_line1: dbRow.address,
    address_line2: '',
    subdistrict: '', // Note: not stored separately in current schema
    district: dbRow.district,
    province: dbRow.province,
    postal_code: dbRow.postal_code,
    is_default: dbRow.is_default,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
};

// Get all addresses for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    
    const addresses = result.rows.map(transformToFrontendFormat);
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลที่อยู่ได้' });
  }
});

// Create new address
router.post('/', authenticateToken, addressValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const dbData = transformToDbFormat(req.body);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If this is set as default, unset other default addresses
    if (dbData.is_default) {
      await client.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses (user_id, name, phone, address, district, province, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, dbData.name, dbData.phone, dbData.address, dbData.district, 
       dbData.province, dbData.postal_code, dbData.is_default]
    );

    await client.query('COMMIT');

    const responseData = transformToFrontendFormat(result.rows[0]);
    res.status(201).json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างที่อยู่ได้' });
  } finally {
    client.release();
  }
});

// Update address
router.put('/:id', authenticateToken, addressValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { id } = req.params;
  const dbData = transformToDbFormat(req.body);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkResult = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์แก้ไข' });
    }

    if (dbData.is_default) {
      await client.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [req.user.id, id]
      );
    }

    const result = await client.query(
      `UPDATE addresses SET name = $1, phone = $2, address = $3, district = $4, 
       province = $5, postal_code = $6, is_default = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [dbData.name, dbData.phone, dbData.address, dbData.district, 
       dbData.province, dbData.postal_code, dbData.is_default, id, req.user.id]
    );

    await client.query('COMMIT');

    const responseData = transformToFrontendFormat(result.rows[0]);
    res.json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตที่อยู่ได้' });
  } finally {
    client.release();
  }
});

// Set address as default
router.put('/:id/default', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkResult = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์ตั้งเป็นค่าเริ่มต้น' });
    }

    // Unset all default addresses for user
    await client.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [req.user.id]
    );

    // Set this address as default
    const result = await client.query(
      'UPDATE addresses SET is_default = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    await client.query('COMMIT');

    const responseData = transformToFrontendFormat(result.rows[0]);
    res.json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'ไม่สามารถตั้งเป็นที่อยู่เริ่มต้นได้' });
  } finally {
    client.release();
  }
});

// Delete address
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบที่อยู่ หรือคุณไม่มีสิทธิ์ลบ' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'ไม่สามารถลบที่อยู่ได้' });
  }
});

export default router;