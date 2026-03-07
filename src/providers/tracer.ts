import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import type { Resource } from '@opentelemetry/resources';
import type { OtelOptions } from '@/core/options';
import { resolveEndpoint, resolveExportTimeout } from '@/core/options';

export interface TracerSetupResult {
  provider: WebTracerProvider;
  exporter: OTLPTraceExporter;
}

export function createTracerProvider(options: OtelOptions, resource: Resource): TracerSetupResult {
  const endpoint = resolveEndpoint(options);
  const timeout = resolveExportTimeout(options);

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  options.configureExporter?.(exporter);

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  options.configureTracing?.(provider);

  provider.register({
    propagator: new W3CTraceContextPropagator(),
  });

  return { provider, exporter };
}
