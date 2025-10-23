// Backend/utils/password.js
import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const validatePassword = (password) => {
  // Password must be at least 8 characters long and contain at least one number and one letter
  const minLength = 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' };
  }
  
  if (!hasNumber || !hasLetter) {
    return { valid: false, message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข' };
  }
  
  return { valid: true };
};