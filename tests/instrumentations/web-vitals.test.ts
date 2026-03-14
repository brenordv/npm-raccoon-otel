import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@opentelemetry/api', () => {
  const mockRecord = vi.fn();
  const mockCreateHistogram = vi.fn().mockReturnValue({ record: mockRecord });
  const mockGetMeter = vi.fn().mockReturnValue({ createHistogram: mockCreateHistogram });

  return {
    metrics: {
      getMeter: mockGetMeter,
    },
    __mockCreateHistogram: mockCreateHistogram,
    __mockGetMeter: mockGetMeter,
  };
});

vi.mock('web-vitals', () => ({
  onLCP: vi.fn(),
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onTTFB: vi.fn(),
  onFCP: vi.fn(),
}));

import { metrics } from '@opentelemetry/api';
import { startWebVitalsCollection } from '../../src/instrumentations/web-vitals';

describe('startWebVitalsCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates five histograms for web vitals', () => {
    startWebVitalsCollection();

    expect(metrics.getMeter).toHaveBeenCalledWith(
      '@raccoon.ninja/otel-react/web-vitals',
      __SDK_VERSION__,
    );

    const createHistogram = metrics.getMeter('test').createHistogram;
    expect(createHistogram).toHaveBeenCalledTimes(5);

    const histogramNames = vi.mocked(createHistogram).mock.calls.map((call) => call[0]);
    expect(histogramNames).toContain('web_vitals.lcp');
    expect(histogramNames).toContain('web_vitals.cls');
    expect(histogramNames).toContain('web_vitals.inp');
    expect(histogramNames).toContain('web_vitals.ttfb');
    expect(histogramNames).toContain('web_vitals.fcp');
  });
});
