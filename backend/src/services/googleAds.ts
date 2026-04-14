import prisma from "../prisma";
import { refreshAccessToken } from "./googleAuth";

export interface CampaignData {
  name: string;
  status: string;
  cost: number;
  clicks: number;
  conversions: number;
  impressions: number;
  ctr: number;
  cpc: number;
  dateFrom: Date;
  dateTo: Date;
  dataSource: "api" | "mock";
}

const GOOGLE_ADS_API_VERSION = "v19";
const DEVELOPER_TOKEN = process.env.DEV_TOKEN!;
const CUSTOMER_ID = process.env.CUSTOMER_ID!;

function getDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);
  const fromStr = dateFrom.toISOString().split("T")[0];
  const toStr = dateTo.toISOString().split("T")[0];
  return { dateFrom, dateTo, fromStr, toStr };
}

function buildQuery(fromStr: string, toStr: string): string {
  return `
    SELECT
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${fromStr}' AND '${toStr}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;
}

export async function fetchCampaigns(userId?: string): Promise<CampaignData[]> {
  const { dateFrom, dateTo, fromStr, toStr } = getDateRange();

  if (!userId) {
    console.warn("[googleAds] No userId — returning mock data");
    return fetchMockCampaigns(dateFrom, dateTo);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.warn("[googleAds] User not found — returning mock data");
    return fetchMockCampaigns(dateFrom, dateTo);
  }

  let accessToken = user.accessToken;

  try {
    accessToken = await refreshAccessToken(user.refreshToken);
    await prisma.user.update({ where: { id: userId }, data: { accessToken } });
  } catch {
    console.warn("[googleAds] Token refresh failed, using stored token");
  }

  try {
    const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEVELOPER_TOKEN,
      },
      body: JSON.stringify({ query: buildQuery(fromStr, toStr) }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[googleAds] API error:", error);
      return fetchMockCampaigns(dateFrom, dateTo);
    }

    const data = await response.json() as any;
    const results = data.results ?? [];

    if (results.length === 0) {
      console.warn("[googleAds] No campaigns from API — using mock data");
      return fetchMockCampaigns(dateFrom, dateTo);
    }

    return results.map((row: any) => ({
      name: row.campaign?.name ?? "Unknown",
      status: row.campaign?.status ?? "UNKNOWN",
      cost: (row.metrics?.costMicros ?? 0) / 1_000_000,
      clicks: Number(row.metrics?.clicks ?? 0),
      conversions: Number(row.metrics?.conversions ?? 0),
      impressions: Number(row.metrics?.impressions ?? 0),
      ctr: (row.metrics?.ctr ?? 0) * 100,
      cpc: (row.metrics?.averageCpc ?? 0) / 1_000_000,
      dateFrom,
      dateTo,
      dataSource: "api" as const,
    }));
  } catch (err) {
    console.error("[googleAds] Fetch failed:", err);
    return fetchMockCampaigns(dateFrom, dateTo);
  }
}

function fetchMockCampaigns(dateFrom: Date, dateTo: Date): CampaignData[] {
  return [
    { name: "Health Campaign", status: "ENABLED", cost: 156.59, clicks: 199, conversions: 142, impressions: 2540, ctr: 7.84, cpc: 0.79, dateFrom, dateTo, dataSource: "mock" },
    { name: "Fashion Campaign", status: "ENABLED", cost: 162.34, clicks: 205, conversions: 144, impressions: 2513, ctr: 8.16, cpc: 0.79, dateFrom, dateTo, dataSource: "mock" },
    { name: "Electronics Campaign", status: "ENABLED", cost: 159.15, clicks: 199, conversions: 148, impressions: 2613, ctr: 7.62, cpc: 0.80, dateFrom, dateTo, dataSource: "mock" },
    { name: "Travel Campaign", status: "ENABLED", cost: 158.84, clicks: 205, conversions: 145, impressions: 2604, ctr: 7.87, cpc: 0.77, dateFrom, dateTo, dataSource: "mock" },
    { name: "Automotive Campaign", status: "ENABLED", cost: 1530.0, clicks: 192, conversions: 0, impressions: 50526, ctr: 0.38, cpc: 7.97, dateFrom, dateTo, dataSource: "mock" },
    { name: "Electronics Retargeting", status: "PAUSED", cost: 610.0, clicks: 40, conversions: 2, impressions: 9302, ctr: 0.43, cpc: 15.25, dateFrom, dateTo, dataSource: "mock" },
    { name: "Fashion - Competitor Keywords", status: "ENABLED", cost: 1850.0, clicks: 88, conversions: 3, impressions: 7333, ctr: 1.2, cpc: 21.02, dateFrom, dateTo, dataSource: "mock" },
  ];
}
