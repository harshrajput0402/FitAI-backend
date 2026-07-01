require("dotenv").config();
require("./config/config");

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const cookieParser = require("cookie-parser");
const routes       = require("./routes/index");
const { generalLimiter, authLimiter } = require("./middleware/rateLimit.middleware");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter); // apply to all routes

// Apply strict limiter to auth routes
app.use("/api/v1/auth", authLimiter);

app.use("/api/v1", routes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong" });
});

module.exports = app;