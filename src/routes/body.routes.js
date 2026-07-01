// ─────────────────────────────────────────
// src/routes/body.routes.js
// ─────────────────────────────────────────
const router      = require("express").Router();
const { logBody, getHistory, getLatest } = require("../controller/body.controller");
const { protect } = require("../middleware/auth.middleware");
const validate    = require("../middleware/validate.middleware");

router.post("/log",     protect, validate("logBody"), logBody);
router.get("/history",  protect, getHistory);
router.get("/latest",   protect, getLatest);

module.exports = router;
