// ─────────────────────────────────────────
// src/middleware/rateLimit.middleware.js
// ─────────────────────────────────────────
const rateLimit = require("express-rate-limit");

// General API rate limit — all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,             // 100 requests per 15 min
  message:  { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for AI route — prevent abuse & cost overrun
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      10,         // 10 AI messages per minute
  message:  { success: false, message: "AI rate limit reached, please wait a moment" },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for auth routes — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      20,              // 20 login attempts per 15 min
  message:  { success: false, message: "Too many auth attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { generalLimiter, aiLimiter, authLimiter };








// ─────────────────────────────────────────
// src/app.js  (final version with rate limiting)
// ─────────────────────────────────────────
