const prisma = require("../config/db");
const authService = require("../services/auth.services");

// ─────────────────────────────────────────
// REGISTER
// POST /api/v1/auth/register
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    // 2. Hash password
    const passwordHash = await authService.hashPassword(password);

    // 3. Create user + empty profile in one transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash },
      });
      await tx.userProfile.create({
        data: { userId: newUser.id },
      });
      return newUser;
    });

    // 4. Generate tokens
    const accessToken  = authService.generateAccessToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, refreshToken);

    // 5. Send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        accessToken,
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// LOGIN
// POST /api/v1/auth/login
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 2. Check password
    const valid = await authService.comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 3. Generate tokens
    const accessToken  = authService.generateAccessToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, refreshToken);

    // 4. Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// REFRESH TOKEN
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    // 1. Verify token signature
    const payload = authService.verifyRefreshToken(token);

    // 2. Check token exists in DB (not revoked)
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Refresh token expired or invalid" });
    }

    // 3. Rotate — delete old, issue new
    await authService.deleteRefreshToken(token);
    const newAccessToken  = authService.generateAccessToken(payload.userId);
    const newRefreshToken = authService.generateRefreshToken(payload.userId);
    await authService.saveRefreshToken(payload.userId, newRefreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

// ─────────────────────────────────────────
// LOGOUT
// POST /api/v1/auth/logout
// ─────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.deleteRefreshToken(token);
    }
    res.clearCookie("refreshToken");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { register, login, refresh, logout };