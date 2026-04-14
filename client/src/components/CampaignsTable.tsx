import { useState } from "react";
import {
  DataTable,
  EmptyState,
  Text,
  Badge,
  Modal,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  Button,
} from "@shopify/polaris";
import type { Campaign, Anomaly } from "../api";

interface Props {
  campaigns: Campaign[];
  loading: boolean;
}

function statusBadge(status: string) {
  if (status === "ENABLED") return <Badge tone="success">Active</Badge>;
  if (status === "PAUSED") return <Badge tone="warning">Paused</Badge>;
  return <Badge>{status}</Badge>;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function conversionRate(conversions: number, clicks: number): string {
  if (clicks === 0) return "0%";
  return ((conversions / clicks) * 100).toFixed(1) + "%";
}

function severityTone(s: string): "critical" | "warning" | "info" {
  if (s === "High") return "critical";
  if (s === "Medium") return "warning";
  return "info";
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--p-color-bg-surface-secondary)",
      borderRadius: "8px",
      padding: "12px 16px",
      minWidth: "110px",
      flex: "1",
    }}>
      <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
      <Text as="p" variant="headingMd" fontWeight="semibold">{value}</Text>
      {sub && <Text as="p" variant="bodySm" tone="subdued">{sub}</Text>}
    </div>
  );
}

function CampaignModal({ campaign, open, onClose }: {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
}) {
  const anomalies: Anomaly[] = campaign.anomalies ?? [];
  const convRate = conversionRate(campaign.conversions, campaign.clicks);
  const cpm = campaign.impressions > 0
    ? "$" + ((campaign.cost / campaign.impressions) * 1000).toFixed(2)
    : "—";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={campaign.name}
      secondaryActions={[{ content: "Close", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* Period */}
          <InlineStack align="space-between">
            <InlineStack gap="200">
              {statusBadge(campaign.status)}
              <Text as="span" variant="bodySm" tone="subdued">
                {campaign.dateFrom && campaign.dateTo
                  ? `${formatDate(campaign.dateFrom)} — ${formatDate(campaign.dateTo)}`
                  : "Last 30 days"}
              </Text>
            </InlineStack>
          </InlineStack>

          <Divider />

          {/* Main metrics */}
          <Text as="h3" variant="headingSm">Performance</Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <MetricCard label="Spend" value={`$${campaign.cost.toFixed(2)}`} />
            <MetricCard label="Clicks" value={campaign.clicks.toLocaleString()} />
            <MetricCard label="Impressions" value={campaign.impressions.toLocaleString()} />
            <MetricCard label="Conversions" value={campaign.conversions.toLocaleString()} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <MetricCard label="CTR" value={`${campaign.ctr.toFixed(2)}%`} sub="Click-through rate" />
            <MetricCard label="CPC" value={`$${campaign.cpc.toFixed(2)}`} sub="Cost per click" />
            <MetricCard label="Conv. Rate" value={convRate} sub="Conversions / Clicks" />
            <MetricCard label="CPM" value={cpm} sub="Cost per 1000 impr." />
          </div>

          {/* Anomalies if any */}
          {anomalies.length > 0 && (
            <>
              <Divider />
              <Text as="h3" variant="headingSm">AI Insights ({anomalies.length})</Text>
              <BlockStack gap="200">
                {anomalies.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      border: a.severity === "High" ? "1.5px solid #d72c0d" : "1px solid #e1e3e5",
                      borderRadius: "8px",
                      padding: "12px",
                      background: a.severity === "High" ? "#fff4f4" : "var(--p-color-bg-surface)",
                    }}
                  >
                    <InlineStack align="space-between" blockAlign="start">
                      <Text as="p" variant="bodyMd">{a.description}</Text>
                      <Badge tone={severityTone(a.severity)}>{a.severity}</Badge>
                    </InlineStack>
                  </div>
                ))}
              </BlockStack>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export function CampaignsTable({ campaigns, loading }: Props) {
  const [selected, setSelected] = useState<Campaign | null>(null);

  if (!loading && campaigns.length === 0) {
    return (
      <EmptyState heading="No campaigns found" image="">
        <p>Click Sync Campaigns to load data from Google Ads.</p>
      </EmptyState>
    );
  }

  const rows = campaigns.map((c) => {
    const anomalyCount = c.anomalies?.length ?? 0;
    return [
      <Box key={c.id}>
        <Button variant="plain" onClick={() => setSelected(c)}>
          {c.name}
        </Button>
      </Box>,
      statusBadge(c.status),
      c.dateFrom ? `${formatDate(c.dateFrom)} — ${formatDate(c.dateTo)}` : "Last 30 days",
      `$${c.cost.toFixed(2)}`,
      c.clicks.toLocaleString(),
      c.conversions.toLocaleString(),
      `${c.ctr.toFixed(2)}%`,
      `$${c.cpc.toFixed(2)}`,
      anomalyCount > 0
        ? <Badge tone={c.anomalies?.some(a => a.severity === "High") ? "critical" : "warning"}>{String(anomalyCount)}</Badge>
        : <Text as="span" tone="subdued">—</Text>,
    ];
  });

  return (
    <>
      <DataTable
        columnContentTypes={["text", "text", "text", "numeric", "numeric", "numeric", "numeric", "numeric", "text"]}
        headings={["Campaign", "Status", "Period", "Cost", "Clicks", "Conv.", "CTR", "CPC", "Issues"]}
        rows={rows}
      />
      {selected && (
        <CampaignModal
          campaign={selected}
          open={true}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
