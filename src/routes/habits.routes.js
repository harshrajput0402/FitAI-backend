// ─────────────────────────────────────────
// src/routes/habits.routes.js
// ─────────────────────────────────────────
const router = require("express").Router();
const { createHabit, getHabits, toggleHabit, deleteHabit } = require("../controller/habits.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/",          protect, createHabit);
router.get("/",           protect, getHabits);
router.put("/:id/toggle", protect, toggleHabit);
router.delete("/:id",     protect, deleteHabit);

module.exports = router;