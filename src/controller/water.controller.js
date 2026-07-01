// ─────────────────────────────────────────
// src/controllers/water.controller.js
// ─────────────────────────────────────────
const prisma = require("../config/db");

// LOG WATER  →  POST /api/v1/water/log
const logWater = async (req, res) => {
  try {
    const { glasses = 1 } = req.body;

    const log = await prisma.waterLog.create({
      data: { userId: req.user.id, glasses },
    });

    return res.status(201).json({ success: true, message: "Water logged", data: log });
  } catch (err) {
    console.error("logWater error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET TODAY'S WATER TOTAL  →  GET /api/v1/water/today
const getTodayWater = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    const logs = await prisma.waterLog.findMany({
      where: {
        userId:   req.user.id,
        loggedAt: { gte: start, lte: end },
      },
    });

    // Sum all glasses logged today
    const totalGlasses = logs.reduce((sum, l) => sum + l.glasses, 0);

    return res.status(200).json({
      success: true,
      data: { totalGlasses, logs },
    });
  } catch (err) {
    console.error("getTodayWater error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { logWater, getTodayWater };









