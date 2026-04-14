import { GoogleGenerativeAI } from "@google/generative-ai";
import { CampaignData } from "./googleAds";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AnomalyResult {
  campaignName: string;
  description: string;
  recommendation: string;
  severity: "Low" | "Medium" | "High";
}

const SYSTEM_PROMPT = `You are a senior Google Ads performance analyst with 10+ years of experience.
You will receive a JSON array of campaign metrics for the last 30 days.

Analyze each campaign and identify real performance issues. For each issue found, provide:
1. A clear one-sentence description of WHAT is wrong
2. A concrete actionable recommendation of WHAT TO DO about it (specific, not generic)
3. A severity level

Anomaly types to detect:
- High spend with zero or near-zero conversions (budget waste)
- Unusually high CPC compared to account average (bidding problem)
- Very low CTR (below 0.5%) with significant spend (ad relevance issue)
- Paused campaigns still accumulating spend (billing anomaly)
- CTR or conversion rate far below account average (performance gap)
- Very low conversion rate despite high clicks (landing page or offer issue)
- High impressions with very low clicks (ad copy problem)

Recommendation guidelines (be specific):
- Instead of "review your campaign" → "Pause this campaign immediately and reallocate its $X budget to [best performing campaign]"
- Instead of "check your keywords" → "Add negative keywords for broad match terms causing irrelevant clicks"
- Instead of "improve your ads" → "A/B test new ad copy focusing on price or urgency, current CTR of X% is 3x below account average"

Return ONLY a valid JSON array (no markdown, no explanation outside JSON).
Each element must have exactly these fields:
  "campaignName": string,
  "description": string (one sentence: what is wrong),
  "recommendation": string (one sentence: what to do, be specific with numbers when possible),
  "severity": "Low" | "Medium" | "High"

Severity rules:
- High: spend > $500 with 0 conversions, OR CPC > 5x account average, OR paused campaign with spend > $100
- Medium: spend > $200 with < 3 conversions, OR CTR < 0.5% with spend > $100, OR conv rate < 0.5%
- Low: minor inefficiencies, slight underperformance vs account average

If no issues found for a campaign — do not include it.
If no issues at all — return [].`;

export async function detectAnomalies(
  campaigns: CampaignData[]
): Promise<AnomalyResult[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const avgCpc = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.cpc, 0) / campaigns.length
    : 0;

  const avgCtr = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length
    : 0;

  const avgConvRate = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + (c.clicks > 0 ? c.conversions / c.clicks : 0), 0) / campaigns.length
    : 0;

  const userMessage = JSON.stringify({
    accountAverages: {
      avgCpc: +avgCpc.toFixed(2),
      avgCtr: +avgCtr.toFixed(2),
      avgConversionRate: +(avgConvRate * 100).toFixed(2),
    },
    campaigns,
  }, null, 2);

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
