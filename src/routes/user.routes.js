// ─────────────────────────────────────────
// src/routes/user.routes.js
// ─────────────────────────────────────────
const router       = require("express").Router();
const { getMe, updateMe, deleteMe } = require("../controller/user.controller");
const { protect }  = require("../middleware/auth.middleware");
const validate     = require("../middleware/validate.middleware");

router.get("/me",    protect, getMe);
router.put("/me",    protect, validate("updateProfile"), updateMe);
router.delete("/me", protect, deleteMe);

module.exports = router;