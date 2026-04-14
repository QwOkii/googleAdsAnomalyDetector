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
    let campaigns = await prisma.campaign.findMany({
      where: { userId: req.userId },
    });

    if (campaigns.length === 0) {
      const raw = await fetchCampaigns(req.userId);
      campaigns = await Promise.all(
        raw.map(async (c) => {
          const existing = await prisma.campaign.findFirst({
            where: { name: c.name, userId: req.userId },
          });
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
                dataSource: c.dataSource,
              },
            });
          }
          return prisma.campaign.create({
            data: {
              userId: req.userId!,
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
              dataSource: c.dataSource,
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
      dataSource: (c.dataSource as "api" | "mock"),
    }));

    const anomalies = await detectAnomalies(campaignPayload);

    await prisma.anomaly.deleteMany({
      where: { campaign: { userId: req.userId } },
    });

    const saved = await Promise.all(
      anomalies.map(async (a) => {
        const campaign = campaigns.find((c) => c.name === a.campaignName);
        if (!campaign) return null;
        return prisma.anomaly.create({
          data: {
            campaignId: campaign.id,
            description: a.description,
            recommendation: a.recommendation ?? "",
            severity: a.severity,
          },
        });
      })
    );

    const result = saved.filter(Boolean);
    const dataSource = campaigns[0]?.dataSource ?? "mock";

    // Fetch saved anomalies with campaign included so frontend gets full objects
    const savedIds = result.map((a) => a!.id);
    const fullAnomalies = await prisma.anomaly.findMany({
      where: { id: { in: savedIds } },
      include: { campaign: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    return res.json({
      analyzed: campaigns.length,
      anomaliesFound: fullAnomalies.length,
      anomalies: fullAnomalies,
      dataSource,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Audit failed" });
  }
});

auditRoutes.get("/", async (req, res) => {
  try {
    const anomalies = await prisma.anomaly.findMany({
      where: { campaign: { userId: req.userId } },
      include: { campaign: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });
    return res.json(anomalies);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch anomalies" });
  }
});
