import express from "express";
import request from "supertest";
import { campaignRoutes } from "../routes/campaigns";

jest.mock("../prisma", () => ({
  prisma: {
    campaign: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("../services/googleAds", () => ({
  fetchCampaigns: jest.fn(),
}));

import { prisma } from "../prisma";
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/campaigns", () => {
  it("returns 200 with an array of campaigns from DB", async () => {
    mockFindMany.mockResolvedValue([dbCampaign]);

    const res = await request(app).get("/api/campaigns");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Brand Awareness");
  });

  it("returns 200 with empty array when DB is empty", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await request(app).get("/api/campaigns");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/campaigns");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/campaigns/sync", () => {
  const rawCampaign = {
    name: "Brand Awareness",
    status: "ENABLED",
    cost: 1000,
    clicks: 500,
    conversions: 10,
    ctr: 2.0,
    cpc: 2.0,
  };

  it("returns { synced, campaigns } after sync", async () => {
    mockDeleteMany.mockResolvedValue({});
    mockFetchCampaigns.mockResolvedValue([rawCampaign]);
    mockCreate.mockResolvedValue(dbCampaign);

    const res = await request(app).post("/api/campaigns/sync");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("synced", 1);
    expect(Array.isArray(res.body.campaigns)).toBe(true);
    expect(res.body.campaigns).toHaveLength(1);
  });

  it("returns 500 on failure", async () => {
    mockDeleteMany.mockRejectedValue(new Error("Delete failed"));

    const res = await request(app).post("/api/campaigns/sync");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
