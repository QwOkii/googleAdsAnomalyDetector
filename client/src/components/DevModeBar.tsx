import { Badge, InlineStack, Text, Button, Box } from "@shopify/polaris";

interface Props {
  devMode: boolean;
  onToggle: () => void;
  dataSource: "api" | "mock" | null;
  lastSyncTime: Date | null;
  campaignCount: number;
  anomalyCount: number;
}

export function DevModeBar({
  devMode,
  onToggle,
  dataSource,
  lastSyncTime,
  campaignCount,
  anomalyCount,
}: Props) {
  if (!devMode) {
    return (
      <div style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 100,
      }}>
        <Button size="slim" onClick={onToggle}>Dev mode</Button>
      </div>
    );
  }

  return (
    <div style={{
      background: "#1a1a2e",
      color: "#e0e0e0",
      padding: "12px 20px",
      fontFamily: "monospace",
      fontSize: "13px",
      borderTop: "2px solid #e63946",
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }}>
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="400" blockAlign="center">
          <Text as="span" variant="bodySm" tone="disabled">
            <span style={{ color: "#e63946", fontWeight: 600 }}>DEV MODE</span>
          </Text>

          <InlineStack gap="200" blockAlign="center">
            <span style={{ color: "#888" }}>data source:</span>
            {dataSource === "api" ? (
              <span style={{ color: "#4ade80", fontWeight: 600 }}>● GOOGLE ADS API</span>
            ) : dataSource === "mock" ? (
              <span style={{ color: "#facc15", fontWeight: 600 }}>● MOCK DATA</span>
            ) : (
              <span style={{ color: "#888" }}>— not synced</span>
            )}
          </InlineStack>

          <span style={{ color: "#888" }}>
            campaigns: <span style={{ color: "#e0e0e0" }}>{campaignCount}</span>
          </span>

          <span style={{ color: "#888" }}>
            anomalies: <span style={{ color: anomalyCount > 0 ? "#e63946" : "#e0e0e0" }}>{anomalyCount}</span>
          </span>

          {lastSyncTime && (
            <span style={{ color: "#888" }}>
              last sync:{" "}
              <span style={{ color: "#e0e0e0" }}>
                {lastSyncTime.toLocaleTimeString()}
              </span>
            </span>
          )}
        </InlineStack>

        <Button size="slim" onClick={onToggle}>Hide dev</Button>
      </InlineStack>
    </div>
  );
}
