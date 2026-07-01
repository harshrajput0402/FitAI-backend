// ─────────────────────────────────────────
// src/routes/nutrition.routes.js
// ─────────────────────────────────────────
const router = require("express").Router();
const { createMeal, getTodayMeals, getMealsByDate, addFoodItem, deleteMeal } = require("../controller/nutrition.controller");
const { protect }  = require("../middleware/auth.middleware");

router.post("/meals",           protect, createMeal);
router.get("/today",            protect, getTodayMeals);
router.get("/history",          protect, getMealsByDate);
router.post("/meals/:id/food",  protect, addFoodItem);
router.delete("/meals/:id",     protect, deleteMeal);

module.exports = router;
