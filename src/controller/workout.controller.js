const prisma = require("../config/db");

// ─────────────────────────────────────────
// CREATE WORKOUT SESSION
// POST /api/v1/workouts
// ─────────────────────────────────────────
const createWorkout = async (req, res) => {
  try {
    const { name, scheduledAt, notes } = req.body;

    const workout = await prisma.workout.create({
      data: {
        userId: req.user.id,
        name,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        notes,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Workout created",
      data: workout,
    });
  } catch (err) {
    console.error("createWorkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET ALL WORKOUTS
// GET /api/v1/workouts
// ─────────────────────────────────────────
const getWorkouts = async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { exercises: true }, // also return exercises inside each workout
    });

    return res.status(200).json({ success: true, data: workouts });
  } catch (err) {
    console.error("getWorkouts error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET SINGLE WORKOUT
// GET /api/v1/workouts/:id
// ─────────────────────────────────────────
const getWorkout = async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: {
        id:     req.params.id,
        userId: req.user.id,  // ensure user owns this workout
      },
      include: { exercises: true },
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    return res.status(200).json({ success: true, data: workout });
  } catch (err) {
    console.error("getWorkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// ADD EXERCISE TO WORKOUT
// POST /api/v1/workouts/:id/exercises
// ─────────────────────────────────────────
const addExercise = async (req, res) => {
  try {
    const { name, muscleGroup, sets, reps, weightKg, durationMin, caloriesBurned, notes, order } = req.body;

    // First confirm workout belongs to this user
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    const exercise = await prisma.workoutExercise.create({
      data: {
        workoutId: req.params.id,
        name,
        muscleGroup,
        sets,
        reps,
        weightKg,
        durationMin,
        caloriesBurned,
        notes,
        order: order || 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Exercise added",
      data: exercise,
    });
  } catch (err) {
    console.error("addExercise error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// COMPLETE A WORKOUT
// PUT /api/v1/workouts/:id/complete
// ─────────────────────────────────────────
const completeWorkout = async (req, res) => {
  try {
    const { durationMin } = req.body;

    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    const updated = await prisma.workout.update({
      where: { id: req.params.id },
      data: {
        completedAt: new Date(),
        durationMin,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Workout marked as complete",
      data: updated,
    });
  } catch (err) {
    console.error("completeWorkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// DELETE WORKOUT
// DELETE /api/v1/workouts/:id
// ─────────────────────────────────────────
const deleteWorkout = async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    await prisma.workout.delete({ where: { id: req.params.id } });

    return res.status(200).json({ success: true, message: "Workout deleted" });
  } catch (err) {
    console.error("deleteWorkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createWorkout, getWorkouts, getWorkout, addExercise, completeWorkout, deleteWorkout };