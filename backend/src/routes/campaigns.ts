import { Router } from "express";
import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";

export const campaignRoutes = Router();

// GET /api/campaigns — повертає кампанії з БД, якщо є; якщо ні — тягне і зберігає
campaignRoutes.get("/", async (_req, res) => {
  try {
    const existing = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(existing);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// POST /api/campaigns/sync — примусово синхронізувати з Google Ads
campaignRoutes.post("/sync", async (_req, res) => {
  try {
    await prisma.campaign.deleteMany();
    const raw = await fetchCampaigns();

    const saved = await Promise.all(
      raw.map((c) =>
        prisma.campaign.create({
          data: {
            name: c.name,
            status: c.status,
            cost: c.cost,
            clicks: c.clicks,
            conversions: c.conversions,
            ctr: c.ctr,
            cpc: c.cpc,
          },
        })
      )
    );

    return res.json({ synced: saved.length, campaigns: saved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sync failed" });
  }
});
