import { useState } from "react";
import {
  Card,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Divider,
  Button,
  ButtonGroup,
} from "@shopify/polaris";
import type { Anomaly } from "../api";

interface Props {
  anomalies: Anomaly[];
  lastAuditTime: Date | null;
}

type Filter = "All" | "High" | "Medium" | "Low";

function severityTone(severity: "Low" | "Medium" | "High"): "critical" | "warning" | "info" {
  if (severity === "High") return "critical";
  if (severity === "Medium") return "warning";
  return "info";
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  if (diff < 60) return `${diff} min ago`;
  const hrs = Math.floor(diff / 60);
  return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [expanded, setExpanded] = useState(false);
  const tone = severityTone(anomaly.severity);
  const isHigh = anomaly.severity === "High";

  return (
    <div style={{
      border: isHigh ? "1.5px solid #d72c0d" : "1px solid #e1e3e5",
      borderRadius: "8px",
      overflow: "hidden",
      background: isHigh ? "#fff8f7" : "#ffffff",
    }}>
      {/* Header */}
      <div
        style={{ padding: "14px 16px", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isHigh ? "#d72c0d" : anomaly.severity === "Medium" ? "#f59e0b" : "#3b82f6",
              flexShrink: 0,
            }} />
            <BlockStack gap="050">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                {anomaly.campaign.name}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {anomaly.description}
              </Text>
            </BlockStack>
          </InlineStack>
          <InlineStack gap="200" blockAlign="center">
            <Badge tone={tone}>{anomaly.severity}</Badge>
            <span style={{
              fontSize: "12px",
              color: "#888",
              transform: expanded ? "rotate(180deg)" : "none",
              display: "inline-block",
              transition: "transform 0.2s",
            }}>▼</span>
          </InlineStack>
        </InlineStack>
      </div>

      {/* Expanded recommendation */}
      {expanded && anomaly.recommendation && (
        <div style={{
          borderTop: "1px solid #e1e3e5",
          padding: "12px 16px",
          background: isHigh ? "#fff0ef" : "#f9fafb",
        }}>
          <InlineStack gap="200" blockAlign="start">
            <span style={{ fontSize: "14px", flexShrink: 0 }}>💡</span>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">
                Recommended action
              </Text>
              <Text as="p" variant="bodyMd">
                {anomaly.recommendation}
              </Text>
            </BlockStack>
          </InlineStack>
        </div>
      )}
    </div>
  );
}

export function AnomaliesSection({ anomalies, lastAuditTime }: Props) {
  const [filter, setFilter] = useState<Filter>("All");

  const highCount = anomalies.filter((a) => a.severity === "High").length;
  const medCount = anomalies.filter((a) => a.severity === "Medium").length;
  const lowCount = anomalies.filter((a) => a.severity === "Low").length;

  const filtered = filter === "All"
    ? [...anomalies].sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.severity] - order[b.severity];
      })
    : anomalies.filter((a) => a.severity === filter);

  if (anomalies.length === 0) {
    return (
      <Card>
        <BlockStack gap="300">
          <InlineStack align="space-between">
            <Text as="h2" variant="headingMd">AI Insights</Text>
            {lastAuditTime && (
              <Text as="p" variant="bodySm" tone="subdued">
                {timeAgo(lastAuditTime)}
              </Text>
            )}
          </InlineStack>
          <div style={{
            padding: "32px",
            textAlign: "center",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px dashed #e1e3e5",
          }}>
            <Text as="p" variant="bodyLg" tone="subdued">
              ✅ No anomalies detected
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              All campaigns are performing within normal parameters.
            </Text>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">AI Insights</Text>
            {lastAuditTime && (
              <Text as="p" variant="bodySm" tone="subdued">
                Last analyzed: {timeAgo(lastAuditTime)}
              </Text>
            )}
          </BlockStack>
          <InlineStack gap="200">
            {highCount > 0 && <Badge tone="critical">{`${highCount} critical`}</Badge>}
            {medCount > 0 && <Badge tone="warning">{`${medCount} medium`}</Badge>}
            {lowCount > 0 && <Badge tone="info">{`${lowCount} low`}</Badge>}
          </InlineStack>
        </InlineStack>

        {/* Filter buttons */}
        {anomalies.length > 1 && (
          <ButtonGroup variant="segmented">
            {(["All", "High", "Medium", "Low"] as Filter[]).map((f) => (
              <Button
                key={f}
                pressed={filter === f}
                onClick={() => setFilter(f)}
                size="slim"
              >
                {f === "All" ? `All (${anomalies.length})` : f === "High" ? `High (${highCount})` : f === "Medium" ? `Medium (${medCount})` : `Low (${lowCount})`}
              </Button>
            ))}
          </ButtonGroup>
        )}

        <Divider />

        {/* Cards */}
        <BlockStack gap="200">
          {filtered.length === 0 ? (
            <Text as="p" tone="subdued">No {filter.toLowerCase()} severity issues.</Text>
          ) : (
            filtered.map((a) => <AnomalyCard key={a.id} anomaly={a} />)
          )}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
