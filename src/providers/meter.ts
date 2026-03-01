import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { metrics } from '@opentelemetry/api';
import type { Resource } from '@opentelemetry/resources';
import type { OtelOptions } from '../core/options';
import { resolveEndpoint, resolveExportTimeout } from '../core/options';

const METRIC_EXPORT_INTERVAL_MS = 30_000;

export function createMeterProvider(options: OtelOptions, resource: Resource): MeterProvider {
  const endpoint = resolveEndpoint(options);
  const timeout = resolveExportTimeout(options);

  const exporter = new OTLPMetricExporter({
    url: `${endpoint}/v1/metrics`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  const provider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: METRIC_EXPORT_INTERVAL_MS,
      }),
    ],
  });

  metrics.setGlobalMeterProvider(provider);

  return provider;
}
