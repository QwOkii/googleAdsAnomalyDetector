import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { AnomaliesSection } from '../components/AnomaliesSection';
import type { Anomaly } from '../api';

function makeAnomaly(
  id: string,
  severity: 'Low' | 'Medium' | 'High',
  name = `Campaign ${id}`
): Anomaly {
  return {
    id,
    campaignId: id,
    description: `Issue with ${name}`,
    recommendation: `Fix the issue with ${name}`,
    severity,
    createdAt: '2026-01-01T00:00:00Z',
    campaign: {
      id,
      name,
      status: 'ENABLED',
      cost: 100,
      clicks: 500,
      conversions: 10,
      impressions: 2000,
      ctr: 2.0,
      cpc: 0.2,
      dateFrom: '2026-01-01T00:00:00Z',
      dateTo: '2026-01-31T00:00:00Z',
      dataSource: 'mock' as const,
      createdAt: '2026-01-01T00:00:00Z',
    },
  };
}

function renderSection(anomalies: Anomaly[], lastAuditTime: Date | null = null) {
  return render(
    <AppProvider i18n={enTranslations}>
      <AnomaliesSection anomalies={anomalies} lastAuditTime={lastAuditTime} />
    </AppProvider>
  );
}

describe('AnomaliesSection', () => {
  it('shows no-anomalies text when anomalies list is empty', () => {
    renderSection([]);
    expect(
      screen.getByText(/No anomalies detected/i)
    ).toBeInTheDocument();
  });

  it('renders a High severity anomaly card with red border style', () => {
    renderSection([makeAnomaly('1', 'High', 'Alpha Campaign')]);
    const heading = screen.getByText('Alpha Campaign');
    let el: HTMLElement | null = heading.parentElement;
    while (el && !el.style.border) {
      el = el.parentElement;
    }
    expect(el).not.toBeNull();
    expect(el).toHaveStyle({ border: '2px solid #d72c0d' });
    expect(el).toHaveStyle({ background: '#fff4f4' });
  });

  it('renders High anomaly before Low anomaly', () => {
    const anomalies = [
      makeAnomaly('2', 'Low', 'Low Campaign'),
      makeAnomaly('1', 'High', 'High Campaign'),
    ];
    renderSection(anomalies);
    const badges = screen.getAllByText(/^(High|Low)$/);
    expect(badges[0]).toHaveTextContent('High');
    expect(badges[1]).toHaveTextContent('Low');
  });

  it('renders High before non-High anomalies', () => {
    const anomalies = [
      makeAnomaly('3', 'Low', 'Low Camp'),
      makeAnomaly('1', 'High', 'High Camp'),
      makeAnomaly('2', 'Medium', 'Med Camp'),
    ];
    renderSection(anomalies);
    const badges = screen.getAllByText(/^(High|Medium|Low)$/);
    expect(badges[0]).toHaveTextContent('High');
    expect(badges[1]).toHaveTextContent('Low');
    expect(badges[2]).toHaveTextContent('Medium');
  });
});
