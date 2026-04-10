import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const get = vi.fn();
  const post = vi.fn();
  const create = vi.fn(() => ({ get, post }));
  return { default: { create } };
});

// Import after mock is set up
const { getCampaigns, getAnomalies, runAudit } = await import('../api');

const mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCampaigns', () => {
  it('calls GET /campaigns and returns data', async () => {
    const data = [{ id: '1', name: 'Test' }];
    mockInstance.get.mockResolvedValueOnce({ data });

    const result = await getCampaigns();

    expect(mockInstance.get).toHaveBeenCalledWith('/campaigns');
    expect(result).toEqual(data);
  });
});

describe('getAnomalies', () => {
  it('calls GET /audit and returns data', async () => {
    const data = [{ id: '1', severity: 'High' }];
    mockInstance.get.mockResolvedValueOnce({ data });

    const result = await getAnomalies();

    expect(mockInstance.get).toHaveBeenCalledWith('/audit');
    expect(result).toEqual(data);
  });
});

describe('runAudit', () => {
  it('calls POST /audit and returns data', async () => {
    const data = { analyzed: 5, anomaliesFound: 2, anomalies: [] };
    mockInstance.post.mockResolvedValueOnce({ data });

    const result = await runAudit();

    expect(mockInstance.post).toHaveBeenCalledWith('/audit');
    expect(result).toEqual(data);
  });
});
