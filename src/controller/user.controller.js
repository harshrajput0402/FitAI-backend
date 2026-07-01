const prisma = require("../config/db");

// ─────────────────────────────────────────
// GET MY PROFILE
// GET /api/v1/user/me
// ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        age:       true,
        gender:    true,
        heightCm:  true,
        avatarUrl: true,
        createdAt: true,
        profile:   true,   // includes goal, activityLevel, targetWeight etc.
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// UPDATE MY PROFILE
// PUT /api/v1/user/me
// ─────────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const {
      // user fields
      name, age, gender, heightCm,
      // profile fields
      goal, activityLevel, targetWeightKg,
      cuttingCals, bulkingCals, maintenanceCals,
      dietaryPref, allergies, equipment,
    } = req.body;

    // Update user table and profile table at the same time
    const [updatedUser] = await prisma.$transaction([
      // 1. Update users table
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(name      && { name }),
          ...(age       && { age }),
          ...(gender    && { gender }),
          ...(heightCm  && { heightCm }),
        },
        select: {
          id: true, name: true, email: true,
          age: true, gender: true, heightCm: true,
        },
      }),
      // 2. Update user_profiles table
      prisma.userProfile.update({
        where: { userId: req.user.id },
        data: {
          ...(goal            && { goal }),
          ...(activityLevel   && { activityLevel }),
          ...(targetWeightKg  && { targetWeightKg }),
          ...(cuttingCals     && { cuttingCals }),
          ...(bulkingCals     && { bulkingCals }),
          ...(maintenanceCals && { maintenanceCals }),
          ...(dietaryPref     && { dietaryPref }),
          ...(allergies       && { allergies }),
          ...(equipment       && { equipment }),
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// DELETE MY ACCOUNT
// DELETE /api/v1/user/me
// ─────────────────────────────────────────
const deleteMe = async (req, res) => {
  try {
    // Deletes user + all related data (cascade set in schema)
    await prisma.user.delete({ where: { id: req.user.id } });

    res.clearCookie("refreshToken");
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("deleteMe error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getMe, updateMe, deleteMe };