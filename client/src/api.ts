import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://ads-api.vkoctak.tech";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.includes("/auth/me")) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export interface Campaign {
  id: string;
  name: string;
  status: string;
  cost: number;
  clicks: number;
  conversions: number;
  impressions: number;
  ctr: number;
  cpc: number;
  dateFrom: string | null;
  dateTo: string | null;
  createdAt: string;
  anomalies?: Anomaly[];
}

export interface Anomaly {
  id: string;
  campaignId: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  createdAt: string;
  campaign: Campaign;
}

export interface AuditResult {
  analyzed: number;
  anomaliesFound: number;
  anomalies: Anomaly[];
}

export const getCampaigns = () =>
  api.get<Campaign[]>("/campaigns").then((r) => r.data);

export const getAnomalies = () =>
  api.get<Anomaly[]>("/audit").then((r) => r.data);

export const runAudit = () =>
  api.post<AuditResult>("/audit").then((r) => r.data);

export const syncCampaigns = () =>
  api.post("/campaigns/sync").then((r) => r.data);

export const getMe = () =>
  axios
    .get<{ user: { id: string; email: string } | null }>(
      `${API_BASE}/auth/me`,
      { withCredentials: true }
    )
    .then((r) => r.data.user);

export const logout = () =>
  axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
