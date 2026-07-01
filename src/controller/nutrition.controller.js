const prisma = require("../config/db");

// ─────────────────────────────────────────
// LOG A MEAL WITH FOOD ITEMS
// POST /api/v1/nutrition/meals
// ─────────────────────────────────────────
const createMeal = async (req, res) => {
  try {
    const { type, note, foodItems } = req.body;
    // foodItems = array of { name, servingG, calories, proteinG, carbsG, fatsG }

    const meal = await prisma.meal.create({
      data: {
        userId: req.user.id,
        type,
        note,
        foodItems: {
          create: foodItems || [], // create all food items in one query
        },
      },
      include: { foodItems: true },
    });

    return res.status(201).json({
      success: true,
      message: "Meal logged",
      data: meal,
    });
  } catch (err) {
    console.error("createMeal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET ALL MEALS FOR TODAY
// GET /api/v1/nutrition/today
// ─────────────────────────────────────────
const getTodayMeals = async (req, res) => {
  try {
    // Start and end of today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const meals = await prisma.meal.findMany({
      where: {
        userId:   req.user.id,
        loggedAt: { gte: start, lte: end },
      },
      include:  { foodItems: true },
      orderBy:  { loggedAt: "asc" },
    });

    // Calculate today's totals
    const totals = meals.reduce((acc, meal) => {
      meal.foodItems.forEach((item) => {
        acc.calories += item.calories  || 0;
        acc.proteinG += item.proteinG  || 0;
        acc.carbsG   += item.carbsG    || 0;
        acc.fatsG    += item.fatsG     || 0;
        acc.fiberG   += item.fiberG    || 0;
        acc.sodiumMg += item.sodiumMg  || 0;
      });
      return acc;
    }, { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0, fiberG: 0, sodiumMg: 0 });

    return res.status(200).json({
      success: true,
      data: { meals, totals },
    });
  } catch (err) {
    console.error("getTodayMeals error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET MEALS BY DATE
// GET /api/v1/nutrition/history?date=2025-06-25
// ─────────────────────────────────────────
const getMealsByDate = async (req, res) => {
  try {
    const date  = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    const meals = await prisma.meal.findMany({
      where: {
        userId:   req.user.id,
        loggedAt: { gte: start, lte: end },
      },
      include:  { foodItems: true },
      orderBy:  { loggedAt: "asc" },
    });

    return res.status(200).json({ success: true, data: meals });
  } catch (err) {
    console.error("getMealsByDate error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// ADD FOOD ITEM TO EXISTING MEAL
// POST /api/v1/nutrition/meals/:id/food
// ─────────────────────────────────────────
const addFoodItem = async (req, res) => {
  try {
    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    const food = await prisma.foodItem.create({
      data: { mealId: req.params.id, ...req.body },
    });

    return res.status(201).json({ success: true, message: "Food item added", data: food });
  } catch (err) {
    console.error("addFoodItem error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// DELETE A MEAL
// DELETE /api/v1/nutrition/meals/:id
// ─────────────────────────────────────────
const deleteMeal = async (req, res) => {
  try {
    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    await prisma.meal.delete({ where: { id: req.params.id } });

    return res.status(200).json({ success: true, message: "Meal deleted" });
  } catch (err) {
    console.error("deleteMeal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createMeal, getTodayMeals, getMealsByDate, addFoodItem, deleteMeal };