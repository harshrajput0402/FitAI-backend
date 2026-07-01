// ─────────────────────────────────────────
const router      = require("express").Router();
const { chat }    = require("../controller/ai.controller");
const { protect } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");

router.post("/chat", protect, aiLimiter, chat);

module.exports = router;