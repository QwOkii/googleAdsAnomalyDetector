import { Router } from "express";
import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";

export const campaignRoutes = Router();

campaignRoutes.get("/", async (_req, res) => {
  try {
    const existing = await prisma.campaign.findMany({
      orderBy: { cost: "desc" },
      include: { anomalies: true },
    });
    return res.json(existing);
  } catch (err) {
    console.error("[campaigns] GET error:", err);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

campaignRoutes.post("/sync", async (req, res) => {
  try {
    const raw = await fetchCampaigns(req.userId);

    const saved = await Promise.all(
      raw.map(async (c) => {
        const existing = await prisma.campaign.findFirst({ where: { name: c.name } });
        if (existing) {
          return prisma.campaign.update({
            where: { id: existing.id },
            data: {
              status: c.status,
              cost: c.cost,
              clicks: c.clicks,
              conversions: c.conversions,
              impressions: c.impressions,
              ctr: c.ctr,
              cpc: c.cpc,
              dateFrom: c.dateFrom,
              dateTo: c.dateTo,
            },
          });
        }
        return prisma.campaign.create({
          data: {
            name: c.name,
            status: c.status,
            cost: c.cost,
            clicks: c.clicks,
            conversions: c.conversions,
            impressions: c.impressions,
            ctr: c.ctr,
            cpc: c.cpc,
            dateFrom: c.dateFrom,
            dateTo: c.dateTo,
          },
        });
      })
    );

    return res.json({ synced: saved.length, campaigns: saved });
  } catch (err) {
    console.error("[campaigns] SYNC error:", err);
    return res.status(500).json({ error: "Sync failed", detail: String(err) });
  }
});
