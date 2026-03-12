const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate random string
 */
const generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Generate strong password (8-20 chars, upper/lower/number/special)
 */
const generateStrongPassword = (length = 12) => {
  const minLength = 8;
  const maxLength = 20;
  const finalLength = Math.max(minLength, Math.min(maxLength, length));

  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+-=[]{};:\"\\|,.<>/?';
  const allChars = `${lowers}${uppers}${numbers}${specials}`;

  const pick = (chars) => chars.charAt(Math.floor(Math.random() * chars.length));

  const passwordChars = [
    pick(lowers),
    pick(uppers),
    pick(numbers),
    pick(specials),
  ];

  for (let i = passwordChars.length; i < finalLength; i++) {
    passwordChars.push(pick(allChars));
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
};

/**
 * Generate OTP (8 digits)
 */
const generateOTP = () => {
  // Generate 8-digit OTP
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

/**
 * Format phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
};

/**
 * Calculate pagination offset
 */
const calculateOffset = (page, limit) => {
  return (page - 1) * limit;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateRandomString,
  generateStrongPassword,
  generateOTP,
  formatPhoneNumber,
  calculateOffset,
};
