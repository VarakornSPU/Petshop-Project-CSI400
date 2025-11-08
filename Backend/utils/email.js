// Backend/utils/email.js
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key provided
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (err) {
    console.error('Failed to initialize SendGrid:', err?.message || err);
  }
}

// sendEmail handles three modes:
// 1) SKIP_EMAIL_SEND=1 -> just log and return success (dev)
// 2) Use SendGrid if SENDGRID_API_KEY present
// 3) Fallback to SMTP (explicit SMTP_HOST/PORT/USER/PASS) or Gmail service
const sendEmail = async (to, subject, html) => {
  // Dev/test mode - do not send
  if (process.env.SKIP_EMAIL_SEND === '1' || process.env.NODE_ENV === 'test') {
    console.log(`[DEBUG] (SKIP_EMAIL_SEND) Would send email to ${to} - Subject: ${subject}\n${html}`);
    return { success: true };
  }

  // 1) Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@petshop.com',
        subject,
        html
      };
      await sgMail.send(msg);
      return { success: true };
    } catch (err) {
      console.error('SendGrid send error:', err?.message || err);
      // continue to SMTP fallback
    }
  }

  // 2) SMTP fallback
  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined);
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    let transporter;
    if (host && port) {
      const secure = port === 465;
      const opts = { host, port, secure };
      if (user && pass) opts.auth = { user, pass };
      transporter = nodemailer.createTransport(opts);
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER || process.env.SMTP_USER, pass: process.env.EMAIL_PASS || process.env.SMTP_PASS }
      });
    }

    await transporter.sendMail({ from: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@petshop.com', to, subject, html });
    return { success: true };
  } catch (err) {
    console.error('SMTP send error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  // Always log reset URL in non-production for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">รีเซ็ตรหัสผ่าน</h2>
      <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี Pet Shop ของคุณ</p>
      <p>คลิกลิงก์ด้านล่างเพื่อสร้างรหัสผ่านใหม่:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">รีเซ็ตรหัสผ่าน</a>
      <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
      <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Pet Shop - ร้านขายอุปกรณ์สัตว์เลี้ยง</p>
    </div>
  `;

  const result = await sendEmail(email, 'รีเซ็ตรหัสผ่าน - Pet Shop', html);
  if (!result.success) console.error('Failed to send password reset email:', result.error);
  return result;
};

export const sendWelcomeEmail = async (email, firstName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">ยินดีต้อนรับ ${firstName}!</h2>
      <p>ขอบคุณที่สมัครสมาชิกกับ Pet Shop</p>
      <p>คุณสามารถเริ่มช้อปปิ้งสินค้าสำหรับสัตว์เลี้ยงของคุณได้แล้ว</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">เริ่มช้อปปิ้ง</a>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Pet Shop - ร้านขายอุปกรณ์สัตว์เลี้ยง</p>
    </div>
  `;

  const result = await sendEmail(email, 'ยินดีต้อนรับสู่ Pet Shop!', html);
  if (!result.success) console.error('Welcome email send error:', result.error);
  return result;
};