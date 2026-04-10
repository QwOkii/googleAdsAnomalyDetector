import express from "express";
import request from "supertest";
import { auditRoutes } from "../routes/audit";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    campaign: { findMany: jest.fn(), create: jest.fn() },
    anomaly: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  },
}));

jest.mock("../services/googleAds", () => ({ fetchCampaigns: jest.fn() }));
jest.mock("../services/anomalyDetector", () => ({ detectAnomalies: jest.fn() }));

import prisma from "../prisma";
import { detectAnomalies } from "../services/anomalyDetector";

const mockCampaignFindMany = prisma.campaign.findMany as jest.Mock;
const mockAnomalyDeleteMany = prisma.anomaly.deleteMany as jest.Mock;
const mockAnomalyCreate = prisma.anomaly.create as jest.Mock;
const mockAnomalyFindMany = prisma.anomaly.findMany as jest.Mock;
const mockDetectAnomalies = detectAnomalies as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/audit", auditRoutes);

const dbCampaign = {
  id: "1",
  name: "Brand Awareness",
  status: "ENABLED",
  cost: 4850,
  clicks: 1200,
  conversions: 0,
  ctr: 2.4,
  cpc: 4.04,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const savedAnomaly = {
  id: "a1",
  campaignId: "1",
  description: "High spend with zero conversions.",
  severity: "High",
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("POST /api/audit", () => {
  it("returns analyzed/anomaliesFound/anomalies on success", async () => {
    mockCampaignFindMany.mockResolvedValue([dbCampaign]);
    mockDetectAnomalies.mockResolvedValue([{
      campaignName: "Brand Awareness",
      description: "High spend with zero conversions.",
      severity: "High",
    }]);
    mockAnomalyDeleteMany.mockResolvedValue({});
    mockAnomalyCreate.mockResolvedValue(savedAnomaly);
    const res = await request(app).post("/api/audit");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("analyzed", 1);
    expect(res.body).toHaveProperty("anomaliesFound", 1);
    expect(Array.isArray(res.body.anomalies)).toBe(true);
  });

  it("returns anomaliesFound: 0 when no anomalies detected", async () => {
    mockCampaignFindMany.mockResolvedValue([dbCampaign]);
    mockDetectAnomalies.mockResolvedValue([]);
    mockAnomalyDeleteMany.mockResolvedValue({});
    const res = await request(app).post("/api/audit");
    expect(res.status).toBe(200);
    expect(res.body.anomaliesFound).toBe(0);
    expect(res.body.anomalies).toEqual([]);
  });

  it("returns 500 when GEMINI_API_KEY missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app).post("/api/audit");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 500 on detectAnomalies failure", async () => {
    mockCampaignFindMany.mockResolvedValue([dbCampaign]);
    mockDetectAnomalies.mockRejectedValue(new Error("Gemini error"));
    mockAnomalyDeleteMany.mockResolvedValue({});
    const res = await request(app).post("/api/audit");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /api/audit", () => {
  it("returns anomalies with campaign data", async () => {
    mockAnomalyFindMany.mockResolvedValue([{ ...savedAnomaly, campaign: dbCampaign }]);
    const res = await request(app).get("/api/audit");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty("campaign");
  });

  it("returns empty array when no anomalies saved", async () => {
    mockAnomalyFindMany.mockResolvedValue([]);
    const res = await request(app).get("/api/audit");
    expect(res.body).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    mockAnomalyFindMany.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/api/audit");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
