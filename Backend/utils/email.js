// Backend/utils/email.js
import nodemailer from 'nodemailer';

// Configure email transporter (using Gmail as example)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@petshop.com',
    to: email,
    subject: 'รีเซ็ตรหัสผ่าน - Pet Shop',
    html: `
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@petshop.com',
    to: email,
    subject: 'ยินดีต้อนรับสู่ Pet Shop!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">ยินดีต้อนรับ ${firstName}!</h2>
        <p>ขอบคุณที่สมัครสมาชิกกับ Pet Shop</p>
        <p>คุณสามารถเริ่มต้นช้อปปิ้งสินค้าสำหรับสัตว์เลี้ยงของคุณได้แล้ว</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">เริ่มช้อปปิ้ง</a>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Pet Shop - ร้านขายอุปกรณ์สัตว์เลี้ยง</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email send error:', error);
    return { success: false, error: error.message };
  }
};