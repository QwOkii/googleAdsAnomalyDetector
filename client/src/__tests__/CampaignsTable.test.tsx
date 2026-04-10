import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { CampaignsTable } from '../components/CampaignsTable';
import type { Campaign } from '../api';

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale',
    status: 'ENABLED',
    cost: 120.5,
    clicks: 1500,
    conversions: 30,
    ctr: 2.5,
    cpc: 0.8,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Winter Promo',
    status: 'PAUSED',
    cost: 50.0,
    clicks: 800,
    conversions: 10,
    ctr: 1.2,
    cpc: 0.6,
    createdAt: '2026-01-02T00:00:00Z',
  },
];

function renderTable(campaigns: Campaign[], loading = false) {
  return render(
    <AppProvider i18n={enTranslations}>
      <CampaignsTable campaigns={campaigns} loading={loading} />
    </AppProvider>
  );
}

describe('CampaignsTable', () => {
  it('renders all column headers', () => {
    renderTable(mockCampaigns);
    expect(screen.getByText('Campaign')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Conversions')).toBeInTheDocument();
    expect(screen.getByText('CTR')).toBeInTheDocument();
    expect(screen.getByText('CPC')).toBeInTheDocument();
  });

  it('renders ENABLED status badge as Active', () => {
    renderTable(mockCampaigns);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders PAUSED status badge as Paused', () => {
    renderTable(mockCampaigns);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('shows empty state when campaigns array is empty', () => {
    renderTable([]);
    expect(screen.getByText('No campaigns found')).toBeInTheDocument();
  });
});
