const Admin = require('../models/Admin');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const getSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

module.exports.userVerification = async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.json({ status: false });
  }
  jwt.verify(token, getSecret(), async (err, data) => {
    if (err) {
      return res.json({ status: false });
    } else {
      const admin = await Admin.findById(data.id);
      if (admin) return res.json({ status: true, user: admin.email });
      else return res.json({ status: false });
    }
  });
};

module.exports.requireAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, getSecret(), async (err, data) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    const admin = await Admin.findById(data.id);
    if (!admin) return res.status(401).json({ message: 'Unauthorized' });
    req.admin = admin;
    next();
  });
};