import { Card, Text, Badge, BlockStack, InlineStack, Divider } from "@shopify/polaris";
import type { Anomaly } from "../api";

interface Props {
  anomalies: Anomaly[];
  lastAuditTime: Date | null;
}

function severityTone(severity: "Low" | "Medium" | "High"): "critical" | "warning" | "info" {
  if (severity === "High") return "critical";
  if (severity === "Medium") return "warning";
  return "info";
}

function minutesAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "less than a minute ago";
  if (diff === 1) return "1 minute ago";
  return `${diff} minutes ago`;
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const tone = severityTone(anomaly.severity);
  const isHigh = anomaly.severity === "High";
  return (
    <div style={{
      border: isHigh ? "2px solid #d72c0d" : "1px solid #e1e3e5",
      borderRadius: "8px", padding: "16px",
      background: isHigh ? "#fff4f4" : "#ffffff",
    }}>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingSm" fontWeight="semibold">{anomaly.campaign.name}</Text>
          <Badge tone={tone}>{anomaly.severity}</Badge>
        </InlineStack>
        <Text as="p" variant="bodyMd" tone="subdued">{anomaly.description}</Text>
      </BlockStack>
    </div>
  );
}

export function AnomaliesSection({ anomalies, lastAuditTime }: Props) {
  if (anomalies.length === 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">AI Insights</Text>
          {lastAuditTime && (
            <Text as="p" variant="bodySm" tone="subdued">
              Last analyzed: {minutesAgo(lastAuditTime)}
            </Text>
          )}
          <Text as="p" tone="subdued">
            No anomalies detected. Run an audit to analyze your campaigns.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const high = anomalies.filter((a) => a.severity === "High");
  const other = anomalies.filter((a) => a.severity !== "High");

  // Badge children must be string — convert count to string
  const badgeLabel = `${anomalies.length} anomal${anomalies.length === 1 ? "y" : "ies"} found`;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">AI Insights</Text>
            {lastAuditTime && (
              <Text as="p" variant="bodySm" tone="subdued">
                Last analyzed: {minutesAgo(lastAuditTime)}
              </Text>
            )}
          </BlockStack>
          <Badge tone={high.length > 0 ? "critical" : "warning"}>
            {badgeLabel}
          </Badge>
        </InlineStack>
        <Divider />
        <BlockStack gap="300">
          {[...high, ...other].map((a) => <AnomalyCard key={a.id} anomaly={a} />)}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
