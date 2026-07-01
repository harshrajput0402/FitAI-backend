const prisma = require("../config/db");

// ─────────────────────────────────────────
// CREATE HABIT
// POST /api/v1/habits
// ─────────────────────────────────────────
const createHabit = async (req, res) => {
  try {
    const { label, icon } = req.body;

    const habit = await prisma.habit.create({
      data: { userId: req.user.id, label, icon },
    });

    return res.status(201).json({ success: true, message: "Habit created", data: habit });
  } catch (err) {
    console.error("createHabit error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET ALL HABITS WITH TODAY'S STATUS
// GET /api/v1/habits
// ─────────────────────────────────────────
const getHabits = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    const habits = await prisma.habit.findMany({
      where:   { userId: req.user.id },
      include: {
        logs: {
          where: { doneAt: { gte: start, lte: end } }, // only today's log
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Add a simple "doneToday" boolean to each habit
    const result = habits.map((h) => ({
      ...h,
      doneToday: h.logs.length > 0,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("getHabits error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// TOGGLE HABIT DONE FOR TODAY
// PUT /api/v1/habits/:id/toggle
// ─────────────────────────────────────────
const toggleHabit = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    // Check if already done today
    const existingLog = await prisma.habitLog.findFirst({
      where: {
        habitId: req.params.id,
        doneAt:  { gte: start, lte: end },
      },
    });

    if (existingLog) {
      // Already done → undo it (delete log, decrease streak)
      await prisma.habitLog.delete({ where: { id: existingLog.id } });
      await prisma.habit.update({
        where: { id: req.params.id },
        data:  { streak: { decrement: 1 } },
      });
      return res.status(200).json({ success: true, message: "Habit unmarked", doneToday: false });
    } else {
      // Not done yet → mark done (create log, increase streak)
      await prisma.habitLog.create({ data: { habitId: req.params.id } });
      await prisma.habit.update({
        where: { id: req.params.id },
        data:  { streak: { increment: 1 } },
      });
      return res.status(200).json({ success: true, message: "Habit completed", doneToday: true });
    }
  } catch (err) {
    console.error("toggleHabit error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// DELETE HABIT
// DELETE /api/v1/habits/:id
// ─────────────────────────────────────────
const deleteHabit = async (req, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: "Habit not found" });
    }

    await prisma.habit.delete({ where: { id: req.params.id } });

    return res.status(200).json({ success: true, message: "Habit deleted" });
  } catch (err) {
    console.error("deleteHabit error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createHabit, getHabits, toggleHabit, deleteHabit };