const prisma = require("../config/db");

// ─────────────────────────────────────────
// WEEKLY ANALYTICS
// GET /api/v1/analytics/weekly
// ─────────────────────────────────────────
const getWeekly = async (req, res) => {
  try {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    // Build data for each day
    const weekData = await Promise.all(days.map(async (day) => {
      const start = new Date(day); start.setHours(0, 0, 0, 0);
      const end   = new Date(day); end.setHours(23, 59, 59, 999);
      const label = day.toLocaleDateString("en-US", { weekday: "short" }); // "Mon"

      // Calories that day
      const meals = await prisma.meal.findMany({
        where:   { userId: req.user.id, loggedAt: { gte: start, lte: end } },
        include: { foodItems: true },
      });
      const calories = meals.reduce((sum, meal) =>
        sum + meal.foodItems.reduce((s, f) => s + (f.calories || 0), 0), 0
      );

      // Workout that day
      const workout = await prisma.workout.findFirst({
        where: { userId: req.user.id, completedAt: { gte: start, lte: end } },
      });

      // Weight that day
      const bodyLog = await prisma.bodyLog.findFirst({
        where:   { userId: req.user.id, loggedAt: { gte: start, lte: end } },
        orderBy: { loggedAt: "desc" },
      });

      // Water that day
      const waterLogs = await prisma.waterLog.findMany({
        where: { userId: req.user.id, loggedAt: { gte: start, lte: end } },
      });
      const glasses = waterLogs.reduce((sum, w) => sum + w.glasses, 0);

      return {
        label,
        date:        day.toISOString().split("T")[0],
        calories,
        workedOut:   !!workout,
        weightKg:    bodyLog?.weightKg || null,
        glasses,
      };
    }));

    // Summary stats
    const totalWorkouts   = weekData.filter((d) => d.workedOut).length;
    const avgCalories     = Math.round(weekData.reduce((s, d) => s + d.calories, 0) / 7);
    const avgWater        = Math.round(weekData.reduce((s, d) => s + d.glasses, 0) / 7);
    const latestWeight    = weekData.filter((d) => d.weightKg).pop()?.weightKg || null;

    return res.status(200).json({
      success: true,
      data: {
        days: weekData,
        summary: { totalWorkouts, avgCalories, avgWater, latestWeight },
      },
    });
  } catch (err) {
    console.error("getWeekly error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// MONTHLY ANALYTICS
// GET /api/v1/analytics/monthly
// ─────────────────────────────────────────
const getMonthly = async (req, res) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Total workouts this month
    const totalWorkouts = await prisma.workout.count({
      where: { userId: req.user.id, completedAt: { gte: monthStart, lte: monthEnd } },
    });

    // All meals this month for calorie trend
    const meals = await prisma.meal.findMany({
      where:   { userId: req.user.id, loggedAt: { gte: monthStart, lte: monthEnd } },
      include: { foodItems: true },
      orderBy: { loggedAt: "asc" },
    });

    // Group calories by week
    const weeklyCalories = [0, 0, 0, 0];
    meals.forEach((meal) => {
      const dayOfMonth = new Date(meal.loggedAt).getDate();
      const weekIndex  = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
      const cals       = meal.foodItems.reduce((s, f) => s + (f.calories || 0), 0);
      weeklyCalories[weekIndex] += cals;
    });

    // Weight trend this month
    const weightLogs = await prisma.bodyLog.findMany({
      where:   { userId: req.user.id, loggedAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { loggedAt: "asc" },
      select:  { weightKg: true, loggedAt: true },
    });

    // Muscle group breakdown from workouts
    const exercises = await prisma.workoutExercise.findMany({
      where: {
        workout: {
          userId:      req.user.id,
          completedAt: { gte: monthStart, lte: monthEnd },
        },
      },
      select: { muscleGroup: true },
    });

    const muscleGroups = exercises.reduce((acc, ex) => {
      const group = ex.muscleGroup || "Other";
      acc[group]  = (acc[group] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        totalWorkouts,
        weeklyCalories: weeklyCalories.map((cal, i) => ({ week: `Week ${i + 1}`, calories: cal })),
        weightTrend:    weightLogs,
        muscleGroups,
      },
    });
  } catch (err) {
    console.error("getMonthly error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getWeekly, getMonthly };