import { Router } from "express";
import type { Campaign } from "@prisma/client";
import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";
import { detectAnomalies } from "../services/anomalyDetector";

export const auditRoutes = Router();

auditRoutes.post("/", async (_req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    let campaigns: Campaign[] = await prisma.campaign.findMany();

    if (campaigns.length === 0) {
      const raw = await fetchCampaigns();
      campaigns = await Promise.all(
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
    }

    const campaignPayload = campaigns.map((c: Campaign) => ({
      name: c.name,
      status: c.status,
      cost: c.cost,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr: c.ctr,
      cpc: c.cpc,
    }));

    const anomalies = await detectAnomalies(campaignPayload);

    await prisma.anomaly.deleteMany();

    const saved = await Promise.all(
      anomalies.map(async (a) => {
        const campaign = campaigns.find((c: Campaign) => c.name === a.campaignName);
        if (!campaign) return null;

        return prisma.anomaly.create({
          data: {
            campaignId: campaign.id,
            description: a.description,
            severity: a.severity,
          },
        });
      })
    );

    const result = saved.filter(Boolean);

    return res.json({
      analyzed: campaigns.length,
      anomaliesFound: result.length,
      anomalies: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Audit failed" });
  }
});

auditRoutes.get("/", async (_req, res) => {
  try {
    const anomalies = await prisma.anomaly.findMany({
      include: { campaign: true },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(anomalies);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch anomalies" });
  }
});
