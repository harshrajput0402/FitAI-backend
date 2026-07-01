// ─────────────────────────────────────────
// src/routes/workout.routes.js
// ─────────────────────────────────────────
const router      = require("express").Router();
const { createWorkout, getWorkouts, getWorkout, addExercise, completeWorkout, deleteWorkout } = require("../controller/workout.controller");
const { protect } = require("../middleware/auth.middleware");
const validate    = require("../middleware/validate.middleware");

router.post("/",                   protect, validate("createWorkout"), createWorkout);
router.get("/",                    protect, getWorkouts);
router.get("/:id",                 protect, getWorkout);
router.post("/:id/exercises",      protect, validate("addExercise"),   addExercise);
router.put("/:id/complete",        protect, completeWorkout);
router.delete("/:id",              protect, deleteWorkout);

module.exports = router;