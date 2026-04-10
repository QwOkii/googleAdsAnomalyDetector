/**
 * Google Ads Service
 * Мок-дані побудовані на основі Advertising_dataset_with_character_target.csv
 * (агрегація по ad_topic за останні 30 днів).
 *
 * Коли буде реальний Google Ads API — замінити fetchMockCampaigns()
 * на OAuth2 запит і повернути той самий тип CampaignData[].
 */

export interface CampaignData {
  name: string;
  status: string;
  cost: number;
  clicks: number;
  conversions: number;
  ctr: number; // percent, e.g. 7.83 means 7.83%
  cpc: number; // cost per click in USD
}

export async function fetchCampaigns(): Promise<CampaignData[]> {
  // TODO: replace with real Google Ads API call
  return fetchMockCampaigns();
}

function fetchMockCampaigns(): CampaignData[] {
  return [
    // --- Normal performing campaigns (from CSV dataset) ---
    {
      name: "Health Campaign",
      status: "ENABLED",
      cost: 156.59,
      clicks: 199,
      conversions: 142,
      ctr: 7.84,
      cpc: 0.79,
    },
    {
      name: "Fashion Campaign",
      status: "ENABLED",
      cost: 162.34,
      clicks: 205,
      conversions: 144,
      ctr: 8.16,
      cpc: 0.79,
    },
    {
      name: "Electronics Campaign",
      status: "ENABLED",
      cost: 159.15,
      clicks: 199,
      conversions: 148,
      ctr: 7.62,
      cpc: 0.80,
    },
    {
      name: "Travel Campaign",
      status: "ENABLED",
      cost: 158.84,
      clicks: 205,
      conversions: 145,
      ctr: 7.87,
      cpc: 0.77,
    },

    // --- Anomaly: High spend, zero conversions (HIGH severity) ---
    {
      name: "Automotive Campaign",
      status: "ENABLED",
      cost: 1530.0,
      clicks: 192,
      conversions: 0,
      ctr: 0.38,
      cpc: 7.97,
    },

    // --- Anomaly: Paused campaign still accumulating cost (MEDIUM severity) ---
    {
      name: "Electronics Retargeting",
      status: "PAUSED",
      cost: 610.0,
      clicks: 40,
      conversions: 2,
      ctr: 0.43,
      cpc: 15.25,
    },

    // --- Anomaly: Very high CPC vs account average ~$0.80 (HIGH severity) ---
    {
      name: "Fashion - Competitor Keywords",
      status: "ENABLED",
      cost: 1850.0,
      clicks: 88,
      conversions: 3,
      ctr: 1.2,
      cpc: 21.02,
    },
  ];
}
