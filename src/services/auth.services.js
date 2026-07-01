const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { 
  JWT_ACCESS_SECRET, 
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES
} = require("../config/config");

// ─── Hash password ───────────────────────
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// ─── Compare password ────────────────────
const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

// ─── Generate access token (short lived) ─
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
};

// ─── Generate refresh token (long lived) ─
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
};

// ─── Save refresh token to DB ────────────
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
};

// ─── Verify refresh token ────────────────
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

// ─── Delete refresh token from DB ────────
const deleteRefreshToken = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
};