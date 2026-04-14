import { GoogleGenerativeAI } from "@google/generative-ai";
import { CampaignData } from "./googleAds";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AnomalyResult {
  campaignName: string;
  description: string;
  severity: "Low" | "Medium" | "High";
}

const SYSTEM_PROMPT = `You are a Google Ads performance analyst specialized in anomaly detection.
You will receive a JSON array of campaign metrics for the last 30 days.
Analyze each campaign for the following anomaly types:
- High spend with zero or near-zero conversions (waste)
- Unusually high CPC compared to other campaigns in the same account
- Very low CTR (below 0.5%) with high spend
- Paused campaigns that still show spend
- CTR or conversion rate far below account average
- Budget exhausted without results

Return ONLY a valid JSON array (no markdown, no explanation outside JSON).
Each element must have exactly these fields:
  "campaignName": string,
  "description": string (one clear sentence explaining the anomaly),
  "severity": "Low" | "Medium" | "High"

Rules for severity:
- High: spend > $1000 with 0 conversions, or CPC > 3x account average
- Medium: spend > $500 with < 5 conversions, or CTR < 0.5%
- Low: minor inefficiencies, paused campaigns with low spend

If no anomalies found for a campaign, do not include it.
If no anomalies at all, return an empty array [].`;

export async function detectAnomalies(
  campaigns: CampaignData[]
): Promise<AnomalyResult[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const userMessage = JSON.stringify(campaigns, null, 2);
  const result = await model.generateContent(userMessage);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as AnomalyResult[];
  } catch {
    console.error("Failed to parse Gemini response:", text);
    return [];
  }
}
