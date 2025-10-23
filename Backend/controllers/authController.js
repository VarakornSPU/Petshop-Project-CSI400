// Backend/scr/controllers/authController.js
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Save user to database with hashedPassword
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};