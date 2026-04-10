import { DataTable, EmptyState, Text, Badge } from "@shopify/polaris";
import type { Campaign } from "../api";

interface Props {
  campaigns: Campaign[];
  loading: boolean;
}

function statusBadge(status: string) {
  if (status === "ENABLED") return <Badge tone="success">Active</Badge>;
  if (status === "PAUSED") return <Badge tone="warning">Paused</Badge>;
  return <Badge>{status}</Badge>;
}

export function CampaignsTable({ campaigns, loading }: Props) {
  if (!loading && campaigns.length === 0) {
    return (
      <EmptyState heading="No campaigns found" image="">
        <p>Click Sync Campaigns to load data from Google Ads.</p>
      </EmptyState>
    );
  }

  const rows = campaigns.map((c) => [
    <Text as="span" fontWeight="semibold">{c.name}</Text>,
    statusBadge(c.status),
    `$${c.cost.toFixed(2)}`,
    c.clicks.toLocaleString(),
    c.conversions.toLocaleString(),
    `${c.ctr.toFixed(2)}%`,
    `$${c.cpc.toFixed(2)}`,
  ]);

  return (
    <DataTable
      columnContentTypes={["text", "text", "numeric", "numeric", "numeric", "numeric", "numeric"]}
      headings={["Campaign", "Status", "Cost", "Clicks", "Conversions", "CTR", "CPC"]}
      rows={rows}
      loading={loading}
    />
  );
}
