import { useState, useMemo } from "react";
import {
  EmptyState,
  Text,
  Badge,
  Modal,
  BlockStack,
  InlineStack,
  Divider,
  Button,
  ButtonGroup,
  Popover,
  DatePicker,
} from "@shopify/polaris";
import type { Campaign, Anomaly } from "../api";

interface Props {
  campaigns: Campaign[];
  loading: boolean;
}

type StatusFilter = "All" | "ENABLED" | "PAUSED";
type SortKey = "cost" | "clicks" | "conversions" | "ctr" | "cpc" | "issues";
type SortDir = "asc" | "desc";
type TimeframePreset = "7d" | "14d" | "30d" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

function statusBadge(status: string) {
  if (status === "ENABLED") return <Badge tone="success">Active</Badge>;
  if (status === "PAUSED") return <Badge tone="warning">Paused</Badge>;
  return <Badge>{status}</Badge>;
}

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
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

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inRange(campaign: Campaign, range: DateRange): boolean {
  // If campaign has no dateFrom/dateTo — always show
  if (!campaign.dateFrom || !campaign.dateTo) return true;
  const from = new Date(campaign.dateFrom);
  const to = new Date(campaign.dateTo);
  // Overlap: campaign period overlaps with selected range
  return from <= range.end && to >= range.start;
}

function MetricCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean
}) {
  return (
    <div style={{
      background: highlight ? "#fff4f4" : "var(--p-color-bg-surface-secondary)",
      border: highlight ? "1px solid #f87171" : "none",
      borderRadius: "8px",
      padding: "12px 16px",
      minWidth: "110px",
      flex: "1",
    }}>
      <Text as="p" variant="bodySm" tone="subdued">{label}</Text>
      <Text as="p" variant="headingMd" fontWeight="semibold"
        tone={highlight ? "critical" : undefined}>{value}</Text>
      {sub && <Text as="p" variant="bodySm" tone="subdued">{sub}</Text>}
    </div>
  );
}

function CampaignModal({ campaign, open, onClose }: {
  campaign: Campaign; open: boolean; onClose: () => void;
}) {
  const anomalies: Anomaly[] = campaign.anomalies ?? [];
  const convRate = conversionRate(campaign.conversions, campaign.clicks);
  const cpm = campaign.impressions > 0
    ? "$" + ((campaign.cost / campaign.impressions) * 1000).toFixed(2)
    : "—";
  const highCpc = campaign.cpc > 5;
  const noConv = campaign.conversions === 0 && campaign.cost > 100;

  return (
    <Modal open={open} onClose={onClose} title={campaign.name}
      secondaryActions={[{ content: "Close", onAction: onClose }]}>
      <Modal.Section>
        <BlockStack gap="400">
          <InlineStack gap="200" blockAlign="center">
            {statusBadge(campaign.status)}
            <Text as="span" variant="bodySm" tone="subdued">
              {campaign.dateFrom && campaign.dateTo
                ? `${formatDate(campaign.dateFrom)} — ${formatDate(campaign.dateTo)}`
                : "Last 30 days"}
            </Text>
            {campaign.dataSource === "mock" && (
              <Badge tone="warning">Demo data</Badge>
            )}
          </InlineStack>

          <Divider />

          <Text as="h3" variant="headingSm">Performance overview</Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <MetricCard label="Total spend" value={`$${campaign.cost.toFixed(2)}`} highlight={noConv} />
            <MetricCard label="Clicks" value={campaign.clicks.toLocaleString()} />
            <MetricCard label="Impressions" value={campaign.impressions.toLocaleString()} />
            <MetricCard label="Conversions" value={campaign.conversions.toLocaleString()} highlight={noConv} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <MetricCard label="CTR" value={`${campaign.ctr.toFixed(2)}%`} sub="Click-through rate" />
            <MetricCard label="CPC" value={`$${campaign.cpc.toFixed(2)}`} sub="Cost per click" highlight={highCpc} />
            <MetricCard label="Conv. rate" value={convRate} sub="Conversions / clicks" />
            <MetricCard label="CPM" value={cpm} sub="Per 1000 impressions" />
          </div>

          {anomalies.length > 0 && (
            <>
              <Divider />
              <Text as="h3" variant="headingSm">Issues found ({anomalies.length})</Text>
              <BlockStack gap="200">
                {anomalies.map((a) => (
                  <div key={a.id} style={{
                    border: a.severity === "High" ? "1.5px solid #d72c0d" : "1px solid #e1e3e5",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "12px 14px",
                      background: a.severity === "High" ? "#fff8f7" : "#fff",
                    }}>
                      <InlineStack align="space-between" blockAlign="start">
                        <Text as="p" variant="bodyMd">{a.description}</Text>
                        <Badge tone={severityTone(a.severity)}>{a.severity}</Badge>
                      </InlineStack>
                    </div>
                    {a.recommendation && (
                      <div style={{
                        padding: "10px 14px",
                        background: "#f9fafb",
                        borderTop: "1px solid #e1e3e5",
                      }}>
                        <InlineStack gap="150" blockAlign="start">
                          <span style={{ fontSize: "13px" }}>💡</span>
                          <Text as="p" variant="bodySm">{a.recommendation}</Text>
                        </InlineStack>
                      </div>
                    )}
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

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
        fontWeight: active ? 600 : 400,
        color: active ? "#202223" : "#6d7175",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span style={{ fontSize: "10px", opacity: active ? 1 : 0.3 }}>
        {active ? (currentDir === "desc" ? "▼" : "▲") : "↕"}
      </span>
    </button>
  );
}

export function CampaignsTable({ campaigns, loading }: Props) {
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Timeframe state
  const [timePreset, setTimePreset] = useState<TimeframePreset>("30d");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({
    start: daysAgo(30),
    end: new Date(),
  });
  const [pickerMonth, setPickerMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  const activeRange: DateRange = useMemo(() => {
    if (timePreset === "7d") return { start: daysAgo(7), end: new Date() };
    if (timePreset === "14d") return { start: daysAgo(14), end: new Date() };
    if (timePreset === "30d") return { start: daysAgo(30), end: new Date() };
    return customRange;
  }, [timePreset, customRange]);

  const timeframeLabel = useMemo(() => {
    if (timePreset === "7d") return "Last 7 days";
    if (timePreset === "14d") return "Last 14 days";
    if (timePreset === "30d") return "Last 30 days";
    return `${formatDateShort(customRange.start)} — ${formatDateShort(customRange.end)}`;
  }, [timePreset, customRange]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      const matchTime = inRange(c, activeRange);
      return matchStatus && matchTime;
    });

    return [...list].sort((a, b) => {
      let aVal: number;
      let bVal: number;
      switch (sortKey) {
        case "cost": aVal = a.cost; bVal = b.cost; break;
        case "clicks": aVal = a.clicks; bVal = b.clicks; break;
        case "conversions": aVal = a.conversions; bVal = b.conversions; break;
        case "ctr": aVal = a.ctr; bVal = b.ctr; break;
        case "cpc": aVal = a.cpc; bVal = b.cpc; break;
        case "issues": aVal = a.anomalies?.length ?? 0; bVal = b.anomalies?.length ?? 0; break;
        default: aVal = a.cost; bVal = b.cost;
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [campaigns, statusFilter, activeRange, sortKey, sortDir]);

  if (!loading && campaigns.length === 0) {
    return (
      <EmptyState heading="No campaigns found" image="">
        <p>Click "Sync Campaigns" to load your Google Ads data.</p>
      </EmptyState>
    );
  }

  const enabledCount = campaigns.filter((c) => c.status === "ENABLED").length;
  const pausedCount = campaigns.filter((c) => c.status === "PAUSED").length;

  return (
    <>
      {/* Filters row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>

        {/* Status filter */}
        <ButtonGroup variant="segmented">
          {([
            ["All", `All (${campaigns.length})`],
            ["ENABLED", `Active (${enabledCount})`],
            ["PAUSED", `Paused (${pausedCount})`],
          ] as [StatusFilter, string][]).map(([val, label]) => (
            <Button
              key={val}
              pressed={statusFilter === val}
              onClick={() => setStatusFilter(val)}
              size="slim"
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#e1e3e5" }} />

        {/* Timeframe presets */}
        <ButtonGroup variant="segmented">
          {([
            ["7d", "7d"],
            ["14d", "14d"],
            ["30d", "30d"],
          ] as [TimeframePreset, string][]).map(([val, label]) => (
            <Button
              key={val}
              pressed={timePreset === val}
              onClick={() => setTimePreset(val)}
              size="slim"
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Custom date picker */}
        <Popover
          active={datePickerOpen}
          activator={
            <Button
              size="slim"
              pressed={timePreset === "custom"}
              onClick={() => {
                setDatePickerOpen((v) => !v);
                setTimePreset("custom");
              }}
              icon={
                <span style={{ fontSize: "12px" }}>📅</span>
              }
            >
              {timePreset === "custom" ? timeframeLabel : "Custom"}
            </Button>
          }
          onClose={() => setDatePickerOpen(false)}
          preferredAlignment="left"
        >
          <div style={{ padding: "16px", minWidth: "300px" }}>
            <DatePicker
              month={pickerMonth.month}
              year={pickerMonth.year}
              onChange={({ start, end }) => {
                setCustomRange({ start, end });
                setTimePreset("custom");
                if (start && end && start.getTime() !== end.getTime()) {
                  setDatePickerOpen(false);
                }
              }}
              onMonthChange={(month, year) => setPickerMonth({ month, year })}
              selected={{ start: customRange.start, end: customRange.end }}
              allowRange
              disableDatesAfter={new Date()}
            />
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e1e3e5" }}>
              <Text as="p" variant="bodySm" tone="subdued">
                Selected: {formatDateShort(customRange.start)} — {formatDateShort(customRange.end)}
              </Text>
            </div>
          </div>
        </Popover>

        {/* Active timeframe label */}
        <Text as="span" variant="bodySm" tone="subdued">
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Empty state for filtered result */}
      {filtered.length === 0 && campaigns.length > 0 && (
        <div style={{
          padding: "24px",
          textAlign: "center",
          background: "#f9fafb",
          borderRadius: "8px",
          border: "1px dashed #e1e3e5",
        }}>
          <Text as="p" tone="subdued">
            No campaigns match the selected filters.{" "}
            <button
              onClick={() => { setStatusFilter("All"); setTimePreset("30d"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2c6ecb", fontSize: "13px", textDecoration: "underline" }}
            >
              Reset filters
            </button>
          </Text>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#6d7175", fontWeight: 500 }}>Campaign</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#6d7175", fontWeight: 500 }}>Status</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#6d7175", fontWeight: 500 }}>Period</th>
                {(["cost", "clicks", "conversions", "ctr", "cpc"] as SortKey[]).map((key) => (
                  <th key={key} style={{ textAlign: "right", padding: "8px 12px" }}>
                    <SortableHeader
                      label={key === "cost" ? "Spend" : key === "ctr" ? "CTR" : key === "cpc" ? "CPC" : key.charAt(0).toUpperCase() + key.slice(1)}
                      sortKey={key}
                      currentSort={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                ))}
                <th style={{ textAlign: "right", padding: "8px 12px" }}>
                  <SortableHeader label="Issues" sortKey="issues" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const anomalyCount = c.anomalies?.length ?? 0;
                const hasHigh = c.anomalies?.some((a) => a.severity === "High");
                const hasMedium = c.anomalies?.some((a) => a.severity === "Medium");
                const rowBg = hasHigh ? "#fff8f7" : hasMedium ? "#fffbf0" : "transparent";

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid #f1f1f1",
                      background: rowBg,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!hasHigh && !hasMedium) {
                        (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = rowBg;
                    }}
                  >
                    <td style={{ padding: "10px 12px", maxWidth: "220px" }}>
                      <button
                        onClick={() => setSelected(c)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                          fontWeight: 500,
                          color: "#202223",
                          fontSize: "13px",
                          textDecoration: "underline",
                          textDecorationColor: "transparent",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "#202223";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "transparent";
                        }}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{statusBadge(c.status)}</td>
                    <td style={{ padding: "10px 12px", color: "#6d7175", whiteSpace: "nowrap" }}>
                      {c.dateFrom ? `${formatDate(c.dateFrom)} — ${formatDate(c.dateTo)}` : "Last 30 days"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>${c.cost.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{c.clicks.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{c.conversions.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{c.ctr.toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: c.cpc > 5 ? "#d72c0d" : "inherit", fontWeight: c.cpc > 5 ? 600 : 400 }}>
                      ${c.cpc.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {anomalyCount > 0
                        ? <Badge tone={hasHigh ? "critical" : "warning"}>{String(anomalyCount)}</Badge>
                        : <span style={{ color: "#c9cccf" }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
