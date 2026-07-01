// ─────────────────────────────────────────
// src/routes/water.routes.js
// ─────────────────────────────────────────
const router = require("express").Router();
const { logWater, getTodayWater } = require("../controller/water.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/log",   protect, logWater);
router.get("/today",  protect, getTodayWater);

module.exports = router;
