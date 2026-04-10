import { Router } from "express";
import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";
import { detectAnomalies } from "../services/anomalyDetector";

export const auditRoutes = Router();

// POST /api/audit — запускає AI аудит, зберігає аномалії, повертає результат
auditRoutes.post("/", async (_req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    // 1. Переконатись що є кампанії в БД
    let campaigns = await prisma.campaign.findMany();
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

    // 2. Один виклик до AI з усіма кампаніями одразу
    const campaignPayload = campaigns.map((c) => ({
      name: c.name,
      status: c.status,
      cost: c.cost,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr: c.ctr,
      cpc: c.cpc,
    }));

    const anomalies = await detectAnomalies(campaignPayload);

    // 3. Очистити старі аномалії і зберегти нові
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

// GET /api/audit — повернути збережені аномалії з кампаніями
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
