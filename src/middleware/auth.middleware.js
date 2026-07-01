const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET } = require("../config/config");

const protect = (req, res, next) => {
  try {
    // Expect: Authorization: Bearer <token>
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);

    req.user = { id: payload.userId }; // available in all controllers
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { protect };