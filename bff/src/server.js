require("dotenv/config");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const logger = require("./config/logger");
const ProxyController = require("./controllers/proxy.controller");

const app = express();
const PORT = process.env.PORT || 4000;
const SERVER_HOST = process.env.SERVER_HOST || "localhost";

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    status: "error",
    message: "Too many requests from this client, please try again later.",
  },
});

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:9123",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "cw-expense-tracker-bff",
    timestamp: new Date(),
  });
});

// Proxy all API requests to API Gateway / Backend
app.use("/api/v1", ProxyController.forwardRequest);
app.use("/uploads", ProxyController.forwardRequest);

app.listen(PORT, SERVER_HOST, () => {
  logger.info(`Backend for Frontend (BFF) running on port ${PORT}`);
});
