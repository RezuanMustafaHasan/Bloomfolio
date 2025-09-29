require("dotenv").config();
const jwt = require("jsonwebtoken");

// Create a JWT for a user id. Requires process.env.JWT_SECRET to be set.
module.exports.createSecretToken = (id) => {
  const secret = process.env.JWT_SECRET || process.env.TOKEN_KEY; // fallback to legacy name if present
  if (!secret) {
    // Provide a clear, actionable error instead of letting jsonwebtoken throw a vague one
    throw new Error(
      "JWT secret is missing. Please set JWT_SECRET (or TOKEN_KEY) in backend/.env"
    );
  }

  // 3 days in seconds
  const expiresInSeconds = 3 * 24 * 60 * 60;
  return jwt.sign({ id }, secret, { expiresIn: expiresInSeconds });
};