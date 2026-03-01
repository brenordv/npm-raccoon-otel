import type { OtelOptions, OtelHandle } from '../core/options';
import { validateOptions, resolveEndpoint, resolveExportTimeout } from '../core/options';

/**
 * Initialize OpenTelemetry for Next.js server-side (instrumentation.ts).
 *
 * This function wraps the Node.js OTel SDK setup for use in Next.js's
 * `instrumentation.ts` file.
 *
 * @example
 * ```typescript
 * // instrumentation.ts
 * import { initOtelServer } from '@raccoon.ninja/otel-react/nextjs';
 *
 * export function register() {
 *   initOtelServer({ serviceName: 'my-nextjs-app' });
 * }
 * ```
 */
export async function initOtelServer(options: OtelOptions): Promise<OtelHandle> {
  validateOptions(options);

  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === 'edge') {
    console.warn(
      '[@raccoon.ninja/otel-react] Edge runtime detected. Server OTel is limited to Node.js runtime.',
    );
    return { shutdown: async () => {} };
  }

  const endpoint = resolveEndpoint(options);
  const timeout = resolveExportTimeout(options);

  // Dynamic imports to prevent bundling Node.js SDK in client builds.
  // These packages must be installed separately by the user as they are
  // Node.js-only and not included in this package's dependencies.
  const { BasicTracerProvider, BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { OTLPLogExporter } = await import('@opentelemetry/exporter-logs-otlp-http');
  const { LoggerProvider, BatchLogRecordProcessor } = await import('@opentelemetry/sdk-logs');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } =
    await import('@opentelemetry/semantic-conventions');
  const { trace } = await import('@opentelemetry/api');
  const { logs } = await import('@opentelemetry/api-logs');

  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: options.serviceName,
    'telemetry.sdk.name': '@raccoon.ninja/otel-react',
    'telemetry.sdk.version': '1.0.0',
  };

  if (options.serviceVersion) {
    attributes[ATTR_SERVICE_VERSION] = options.serviceVersion;
  }
  if (options.environment) {
    attributes[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT] = options.environment;
  }
  if (options.resourceAttributes) {
    Object.assign(attributes, options.resourceAttributes);
  }

  const resource = resourceFromAttributes(attributes);

  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });

  trace.setGlobalTracerProvider(tracerProvider);

  const logExporter = new OTLPLogExporter({
    url: `${endpoint}/v1/logs`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
  logs.setGlobalLoggerProvider(loggerProvider);

  return {
    shutdown: async () => {
      await Promise.all([tracerProvider.forceFlush(), loggerProvider.forceFlush()]);
      await Promise.all([tracerProvider.shutdown(), loggerProvider.shutdown()]);
    },
  };
}
