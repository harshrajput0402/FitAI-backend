// ─────────────────────────────────────────
// src/middleware/validate.middleware.js
// Zod validation — runs before controllers
// ─────────────────────────────────────────
const { z } = require("zod");

// ── Reusable schemas ──────────────────────
const schemas = {
  register: z.object({
    name:     z.string().min(2,  "Name must be at least 2 characters"),
    email:    z.string().email("Invalid email address"),
    password: z.string().min(6,  "Password must be at least 6 characters"),
  }),

  login: z.object({
    email:    z.string().email("Invalid email"),
    password: z.string().min(1,  "Password is required"),
  }),

  updateProfile: z.object({
    name:           z.string().min(2).optional(),
    age:            z.number().min(10).max(100).optional(),
    gender:         z.enum(["Male", "Female", "Other"]).optional(),
    heightCm:       z.number().min(50).max(300).optional(),
    goal:           z.enum(["fat_loss", "muscle_gain", "maintenance"]).optional(),
    activityLevel:  z.enum(["sedentary", "light", "moderate", "very_active"]).optional(),
    targetWeightKg: z.number().min(20).max(500).optional(),
  }),

  logBody: z.object({
    weightKg:   z.number().min(1).max(500).optional(),
    bodyFatPct: z.number().min(1).max(100).optional(),
    chestCm:    z.number().optional(),
    waistCm:    z.number().optional(),
    hipsCm:     z.number().optional(),
    armCm:      z.number().optional(),
    thighCm:    z.number().optional(),
    note:       z.string().optional(),
  }),

  createWorkout: z.object({
    name:        z.string().min(1, "Workout name is required"),
    scheduledAt: z.string().optional(),
    notes:       z.string().optional(),
  }),

  addExercise: z.object({
    name:          z.string().min(1, "Exercise name is required"),
    muscleGroup:   z.string().min(1, "Muscle group is required"),
    sets:          z.number().min(1),
    reps:          z.string().min(1),
    weightKg:      z.number().optional(),
    durationMin:   z.number().optional(),
    caloriesBurned:z.number().optional(),
    notes:         z.string().optional(),
    order:         z.number().optional(),
  }),
};

// ── Middleware factory ─────────────────────
// Usage: validate("register")  validate("login")  etc.
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(); // no schema = skip validation

  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path[0],
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body = result.data; // replace with parsed & sanitized data
  next();
};

module.exports = validate;









