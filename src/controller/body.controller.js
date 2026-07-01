const prisma = require("../config/db");

// ─────────────────────────────────────────
// LOG WEIGHT / MEASUREMENTS
// POST /api/v1/body/log
// ─────────────────────────────────────────
const logBody = async (req, res) => {
  try {
    const { weightKg, bodyFatPct, chestCm, waistCm, hipsCm, armCm, thighCm, note } = req.body;

    const log = await prisma.bodyLog.create({
      data: {
        userId: req.user.id,
        weightKg,
        bodyFatPct,
        chestCm,
        waistCm,
        hipsCm,
        armCm,
        thighCm,
        note,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Body log saved",
      data: log,
    });
  } catch (err) {
    console.error("logBody error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET WEIGHT HISTORY
// GET /api/v1/body/history?limit=30
// ─────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const logs = await prisma.bodyLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { loggedAt: "desc" },
      take:    limit,
      select: {
        id:        true,
        weightKg:  true,
        bodyFatPct:true,
        loggedAt:  true,
        note:      true,
      },
    });

    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    console.error("getHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET LATEST BODY LOG
// GET /api/v1/body/latest
// ─────────────────────────────────────────
const getLatest = async (req, res) => {
  try {
    const log = await prisma.bodyLog.findFirst({
      where:   { userId: req.user.id },
      orderBy: { loggedAt: "desc" },
    });

    return res.status(200).json({ success: true, data: log });
  } catch (err) {
    console.error("getLatest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { logBody, getHistory, getLatest };