const Admin = require('../models/Admin');
const { createAdminSecretToken } = require('../util/AdminSecretToken');
const bcrypt = require('bcryptjs');

module.exports.AdminSignup = async (req, res, next) => {
  try {
    const { email, password, name, createdAt } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists' });
    }
    const admin = await Admin.create({ email, password, name, createdAt });
    const token = createAdminSecretToken(admin._id);
    res.cookie('admin_token', token, {
      withCredentials: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ message: 'Admin signed up successfully', success: true, admin });
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.AdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message: 'All fields are required' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ message: 'Incorrect password or email' });
    }
    const auth = await bcrypt.compare(password, admin.password);
    if (!auth) {
      return res.json({ message: 'Incorrect password or email' });
    }
    const token = createAdminSecretToken(admin._id);
    res.cookie('admin_token', token, {
      withCredentials: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ message: 'Admin logged in successfully', success: true });
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.AdminLogout = async (req, res) => {
  try {
    res.cookie('admin_token', '', {
      withCredentials: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    res.json({ success: true, message: 'Admin logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};