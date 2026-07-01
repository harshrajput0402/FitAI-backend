
// ─────────────────────────────────────────
// src/routes/index.js  (final version)
const router            = require("express").Router();
const authRoutes        = require("./auth.routes");
const userRoutes        = require("./user.routes");
const bodyRoutes        = require("./body.routes");
const workoutRoutes     = require("./workout.routes");
const nutritionRoutes   = require("./nutrition.routes");
const habitsRoutes      = require("./habits.routes");
const waterRoutes       = require("./water.routes");
const aiRoutes          = require("./ai.routes");
const analyticsRoutes   = require("./analytics.routes");

router.use("/auth",      authRoutes);
router.use("/user",      userRoutes);
router.use("/body",      bodyRoutes);
router.use("/workouts",  workoutRoutes);
router.use("/nutrition", nutritionRoutes);
router.use("/habits",    habitsRoutes);
router.use("/water",     waterRoutes);
router.use("/ai",        aiRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;