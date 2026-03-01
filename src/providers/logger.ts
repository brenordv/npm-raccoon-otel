import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import type { Resource } from '@opentelemetry/resources';
import type { OtelOptions } from '../core/options';
import { resolveEndpoint, resolveExportTimeout } from '../core/options';

export function createLoggerProvider(options: OtelOptions, resource: Resource): LoggerProvider {
  const endpoint = resolveEndpoint(options);
  const timeout = resolveExportTimeout(options);

  const exporter = new OTLPLogExporter({
    url: `${endpoint}/v1/logs`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  const provider = new LoggerProvider({ resource });
  provider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));

  logs.setGlobalLoggerProvider(provider);

  return provider;
}
