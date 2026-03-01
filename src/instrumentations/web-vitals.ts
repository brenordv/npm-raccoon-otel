import { metrics } from '@opentelemetry/api';
import type { Metric } from 'web-vitals';

const METER_NAME = '@raccoon.ninja/otel-react/web-vitals';

export function startWebVitalsCollection(): void {
  const meter = metrics.getMeter(METER_NAME, '1.0.0');

  const lcpHistogram = meter.createHistogram('web_vitals.lcp', {
    description: 'Largest Contentful Paint',
    unit: 'ms',
  });

  const clsHistogram = meter.createHistogram('web_vitals.cls', {
    description: 'Cumulative Layout Shift',
    unit: '',
  });

  const inpHistogram = meter.createHistogram('web_vitals.inp', {
    description: 'Interaction to Next Paint',
    unit: 'ms',
  });

  const ttfbHistogram = meter.createHistogram('web_vitals.ttfb', {
    description: 'Time to First Byte',
    unit: 'ms',
  });

  const fcpHistogram = meter.createHistogram('web_vitals.fcp', {
    description: 'First Contentful Paint',
    unit: 'ms',
  });

  const recordMetric = (histogram: ReturnType<typeof meter.createHistogram>) => {
    return (metric: Metric) => {
      const attrs: Record<string, string> = {
        'web_vitals.rating': metric.rating,
      };

      if (typeof window !== 'undefined' && window.location) {
        attrs['page.url'] = window.location.pathname;
      }

      histogram.record(metric.value, attrs);
    };
  };

  // Dynamic import to enable tree-shaking when web-vitals is not used
  import('web-vitals').then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
    onLCP(recordMetric(lcpHistogram));
    onCLS(recordMetric(clsHistogram));
    onINP(recordMetric(inpHistogram));
    onTTFB(recordMetric(ttfbHistogram));
    onFCP(recordMetric(fcpHistogram));
  });
}
