import { Router } from "express";
import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";
import { detectAnomalies } from "../services/anomalyDetector";

export const auditRoutes = Router();

auditRoutes.post("/", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    let campaigns = await prisma.campaign.findMany();

    if (campaigns.length === 0) {
      const raw = await fetchCampaigns(req.userId);
      campaigns = await Promise.all(
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
    }

    const campaignPayload = campaigns.map((c) => ({
      name: c.name,
      status: c.status,
      cost: c.cost,
      clicks: c.clicks,
      conversions: c.conversions,
      impressions: c.impressions,
      ctr: c.ctr,
      cpc: c.cpc,
      dateFrom: c.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo: c.dateTo ?? new Date(),
    }));

    const anomalies = await detectAnomalies(campaignPayload);

    await prisma.anomaly.deleteMany();

    const saved = await Promise.all(
      anomalies.map(async (a) => {
        const campaign = campaigns.find((c) => c.name === a.campaignName);
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
