require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports.createAdminSecretToken = (id) => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ id, role: 'admin' }, secret, {
    expiresIn: 3 * 24 * 60 * 60,
  });
};