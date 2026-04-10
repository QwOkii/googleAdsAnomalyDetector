// Mock must be set up before the module loads — genAI is created at module scope
jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

import { detectAnomalies } from "../services/anomalyDetector";
import type { CampaignData } from "../services/googleAds";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGenerateContent: jest.Mock = require("@google/generative-ai")
  .__mockGenerateContent;

const sampleCampaign: CampaignData = {
  name: "Test Campaign",
  status: "ENABLED",
  cost: 1500,
  clicks: 100,
  conversions: 0,
  ctr: 1.2,
  cpc: 15.0,
};

beforeEach(() => {
  mockGenerateContent.mockReset();
});

describe("detectAnomalies", () => {
  it("returns [] when called with empty input", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "[]" },
    });

    const result = await detectAnomalies([]);
    expect(result).toEqual([]);
  });

  it("parses a valid JSON response from Gemini", async () => {
    const anomaly = {
      campaignName: "Test Campaign",
      description: "High spend with zero conversions.",
      severity: "High",
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify([anomaly]) },
    });

    const result = await detectAnomalies([sampleCampaign]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(anomaly);
  });

  it("strips markdown fences before parsing", async () => {
    const anomaly = {
      campaignName: "Test Campaign",
      description: "Low CTR with high spend.",
      severity: "Medium",
    };
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "```json\n" + JSON.stringify([anomaly]) + "\n```",
      },
    });

    const result = await detectAnomalies([sampleCampaign]);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("Medium");
  });

  it("returns [] and does not throw on malformed JSON response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "not valid json {{ broken" },
    });

    const result = await detectAnomalies([sampleCampaign]);
    expect(result).toEqual([]);
  });
});
