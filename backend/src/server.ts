import path from "path";
import dotenv from "dotenv";

// В production (Docker) .env не використовується — змінні передаються через docker-compose env
// В dev режимі .env знаходиться на рівень вище від dist/ або src/
const envPath = process.env.NODE_ENV === "production"
  ? undefined
  : path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath, override: true });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { campaignRoutes } from "./routes/campaigns";
import { auditRoutes } from "./routes/audit";
import { authRoutes } from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";
import prisma from "./prisma";

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/api/campaigns", requireAuth, campaignRoutes);
app.use("/api/audit", requireAuth, auditRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
