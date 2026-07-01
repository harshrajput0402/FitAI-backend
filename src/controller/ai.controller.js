const Groq = require("groq-sdk");
const prisma = require("../config/db");
const { GROQ_API_KEY } = require("../config/config");

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ─────────────────────────────────────────
// AI CHAT
// POST /api/v1/ai/chat
// ─────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ success: false, message: "No messages provided" });
    }

    // 1. Fetch user's real data from DB
    const user = await prisma.user.findUnique({
      where:   { id: req.user.id },
      include: { profile: true },
    });

    const latestBody = await prisma.bodyLog.findFirst({
      where:   { userId: req.user.id },
      orderBy: { loggedAt: "desc" },
    });

    // Today's nutrition totals
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    const todayMeals = await prisma.meal.findMany({
      where:   { userId: req.user.id, loggedAt: { gte: start, lte: end } },
      include: { foodItems: true },
    });
    const todayCalories = todayMeals.reduce((sum, meal) =>
      sum + meal.foodItems.reduce((s, f) => s + (f.calories || 0), 0), 0
    );

    // Workouts this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyWorkouts = await prisma.workout.count({
      where: { userId: req.user.id, completedAt: { gte: weekStart } },
    });

    // 2. Personalized system prompt with real user data
    const systemPrompt = `You are an expert AI fitness coach inside the FitAI Pro app. You are personalized to this specific user:

Name: ${user.name}
Goal: ${user.profile?.goal?.replace("_", " ") || "not set"}
Activity Level: ${user.profile?.activityLevel?.replace("_", " ") || "not set"}
Current Weight: ${latestBody?.weightKg ? `${latestBody.weightKg} kg` : "not logged"}
Target Weight: ${user.profile?.targetWeightKg ? `${user.profile.targetWeightKg} kg` : "not set"}
Calorie Target: ${user.profile?.maintenanceCals || "not set"} kcal/day
Today's Calories Consumed: ${todayCalories} kcal
Workouts This Week: ${weeklyWorkouts}
Dietary Preference: ${user.profile?.dietaryPref || "standard"}
Equipment: ${user.profile?.equipment || "not set"}

Your role:
- Give specific, actionable advice based on this user's real data above
- Be encouraging but honest  
- Keep responses concise and practical
- Reference their actual stats when relevant
- Never give dangerous medical advice`;

    // 3. Call Groq API
    // Groq uses OpenAI-compatible format — system + chat history
    const completion = await groq.chat.completions.create({
      model:       "llama-3.1-8b-instant", // fast, free, great quality
      max_tokens:  512,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });

    const aiText = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      data: { message: aiText },
    });
  } catch (err) {
    console.error("AI chat error:", err);

    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI is busy, please wait a few seconds and try again",
      });
    }

    return res.status(500).json({ success: false, message: "AI service error" });
  }
};

module.exports = { chat };