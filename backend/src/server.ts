import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { campaignRoutes } from "./routes/campaigns";
import { auditRoutes } from "./routes/audit";
import { authRoutes } from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";
import prisma from "./prisma";

// In production env vars come from Docker. In dev — load from .env file
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
}

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigin = process.env.FRONTEND_URL || "https://ads.vkoctak.tech";

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
