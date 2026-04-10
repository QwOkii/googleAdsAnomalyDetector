import { useState, useEffect, useCallback } from "react";
import {
  AppProvider,
  Page,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Spinner,
  Badge,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { getCampaigns, getAnomalies, runAudit, syncCampaigns, getMe, logout } from "./api";
import type { Campaign, Anomaly } from "./api";
import { CampaignsTable } from "./components/CampaignsTable";
import { AnomaliesSection } from "./components/AnomaliesSection";
import { LoginPage } from "./components/LoginPage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [backendStatus, setBackendStatus] = useState<"ok" | "error" | "checking">("checking");

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => setBackendStatus(r.ok ? "ok" : "error"))
      .catch(() => setBackendStatus("error"));
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    setError(null);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch {
      setError("Failed to load campaigns. Make sure the backend is running.");
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  const loadAnomalies = useCallback(async () => {
    try {
      const data = await getAnomalies();
      setAnomalies(data);
    } catch {
      // silent — anomalies are optional on initial load
    }
  }, []);

  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me);
        if (me) {
          loadCampaigns();
          loadAnomalies();
        }
      })
      .catch(() => setUser(null));
  }, [loadCampaigns, loadAnomalies]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCampaigns([]);
    setAnomalies([]);
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await syncCampaigns();
      await loadCampaigns();
    } catch {
      setError("Sync failed. Make sure the backend is running.");
    } finally {
      setSyncing(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    setAuditMessage(null);
    setError(null);
    try {
      const result = await runAudit();
      setAnomalies(result.anomalies);
      setLastAuditTime(new Date());
      setAuditMessage(
        `Audit complete: analyzed ${result.analyzed} campaigns, found ${result.anomaliesFound} anomalie(s).`
      );
    } catch {
      setError("Audit failed. Check your GEMINI_API_KEY in backend .env.");
    } finally {
      setAuditing(false);
    }
  };

  if (user === undefined) {
    return (
      <AppProvider i18n={enTranslations}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spinner accessibilityLabel="Checking session" size="large" />
        </div>
      </AppProvider>
    );
  }

  if (user === null) {
    return <LoginPage />;
  }

  const highCount = anomalies.filter((a) => a.severity === "High").length;

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Google Ads Anomaly Detector"
        subtitle="AI-powered campaign performance analysis"
        additionalMetadata={
          backendStatus === "checking" ? null : (
            <Badge tone={backendStatus === "ok" ? "success" : "critical"}>
              {backendStatus === "ok" ? "Backend connected" : "Backend unreachable"}
            </Badge>
          )
        }
        primaryAction={
          <Button
            variant="primary"
            tone={highCount > 0 ? "critical" : undefined}
            onClick={handleRunAudit}
            loading={auditing}
          >
            {auditing ? "Running Audit…" : "Run Audit"}
          </Button>
        }
        secondaryActions={[
          {
            content: "Sync Campaigns",
            onAction: handleSync,
            loading: syncing,
            disabled: syncing,
          },
          {
            content: user.email,
            onAction: handleLogout,
          },
        ]}
      >
        <BlockStack gap="500">
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          )}
          {auditMessage && (
            <Banner tone="success" onDismiss={() => setAuditMessage(null)}>
              <p>{auditMessage}</p>
            </Banner>
          )}
          {highCount > 0 && (
            <Banner tone="critical">
              <p>
                <strong>{highCount} critical anomal{highCount === 1 ? "y" : "ies"}</strong>{" "}
                detected. Immediate attention required.
              </p>
            </Banner>
          )}
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">Campaigns</Text>
                {loadingCampaigns && <Spinner size="small" />}
              </InlineStack>
              <CampaignsTable campaigns={campaigns} loading={loadingCampaigns} />
            </BlockStack>
          </Card>
          <AnomaliesSection anomalies={anomalies} lastAuditTime={lastAuditTime} />
        </BlockStack>
      </Page>
    </AppProvider>
  );
}
