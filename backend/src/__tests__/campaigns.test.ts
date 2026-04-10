import express from "express";
import request from "supertest";
import { campaignRoutes } from "../routes/campaigns";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    campaign: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  },
}));

jest.mock("../services/googleAds", () => ({
  fetchCampaigns: jest.fn(),
}));

import prisma from "../prisma";
import { fetchCampaigns } from "../services/googleAds";

const mockFindMany = prisma.campaign.findMany as jest.Mock;
const mockCreate = prisma.campaign.create as jest.Mock;
const mockDeleteMany = prisma.campaign.deleteMany as jest.Mock;
const mockFetchCampaigns = fetchCampaigns as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/campaigns", campaignRoutes);

const dbCampaign = {
  id: "1",
  name: "Brand Awareness",
  status: "ENABLED",
  cost: 1000,
  clicks: 500,
  conversions: 10,
  ctr: 2.0,
  cpc: 2.0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe("GET /api/campaigns", () => {
  it("returns campaigns from DB", async () => {
    mockFindMany.mockResolvedValue([dbCampaign]);
    const res = await request(app).get("/api/campaigns");
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Brand Awareness");
  });

  it("returns empty array when DB empty", async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await request(app).get("/api/campaigns");
    expect(res.body).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/api/campaigns");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/campaigns/sync", () => {
  it("returns synced campaigns", async () => {
    mockDeleteMany.mockResolvedValue({});
    mockFetchCampaigns.mockResolvedValue([{
      name: "Brand Awareness", status: "ENABLED",
      cost: 1000, clicks: 500, conversions: 10, ctr: 2.0, cpc: 2.0,
    }]);
    mockCreate.mockResolvedValue(dbCampaign);
    const res = await request(app).post("/api/campaigns/sync");
    expect(res.status).toBe(200);
    expect(res.body.synced).toBe(1);
  });

  it("returns 500 on failure", async () => {
    mockDeleteMany.mockRejectedValue(new Error("fail"));
    const res = await request(app).post("/api/campaigns/sync");
    expect(res.status).toBe(500);
  });
});
