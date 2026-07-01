// ─────────────────────────────────────────
// ─────────────────────────────────────────
const router = require("express").Router();
const { getWeekly, getMonthly } = require("../controller/analytics.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/weekly",  protect, getWeekly);
router.get("/monthly", protect, getMonthly);

module.exports = router;
