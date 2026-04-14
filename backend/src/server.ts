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

// Debug endpoint — shows raw Google Ads API response
app.get("/api/debug/ads", requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { refreshAccessToken } = await import("./services/googleAuth");
    let accessToken = user.accessToken;
    try {
      accessToken = await refreshAccessToken(user.refreshToken);
    } catch (e) {
      return res.json({ warning: "Token refresh failed", error: String(e), accessToken: accessToken ? "exists" : "missing" });
    }

    const CUSTOMER_ID = process.env.CUSTOMER_ID!;
    const DEV_TOKEN = process.env.DEV_TOKEN!;

    const url = `https://googleads.googleapis.com/v18/customers/${CUSTOMER_ID}/googleAds:search`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEV_TOKEN,
      },
      body: JSON.stringify({
        query: `SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks FROM campaign WHERE campaign.status != 'REMOVED' LIMIT 5`,
      }),
    });

    const text = await response.text();
    return res.json({
      status: response.status,
      ok: response.ok,
      customerId: CUSTOMER_ID,
      devTokenPresent: !!DEV_TOKEN,
      accessTokenPresent: !!accessToken,
      body: text,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

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
