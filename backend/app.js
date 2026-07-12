const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { env } = require("./src/config/env");
const apiRouter = require("./src/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
// Capture the raw body for payment webhooks (needed for signature verification).
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
if (env.NODE_ENV !== "test") app.use(morgan("dev"));

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// API
app.use("/api", apiRouter);

// Static polished UI (public event pages, scanner, dashboard)
app.use(express.static(path.join(__dirname, "public")));

// 404 + error handling (API only; static falls through to express.static)
app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
