import { trace } from '@opentelemetry/api';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SeverityNumber } from '@opentelemetry/api-logs';
import type { OtelOptions, OtelHandle } from '../core/options';
import { validateOptions, resolveEndpoint, resolveExportTimeout } from '../core/options';
import { buildResource } from '../core/resource';
import { createLoggerProvider } from '../providers/logger';
import { createMeterProvider } from '../providers/meter';

let initialized = false;

/**
 * Initialize OpenTelemetry for React Native.
 *
 * Key differences from browser init:
 * - Uses BasicTracerProvider (sdk-trace-base) instead of WebTracerProvider
 * - Only fetch instrumentation enabled (no document-load, no user-interaction, no Web Vitals)
 * - XHR disabled by default to avoid duplicate spans (RN's fetch polyfills over XHR)
 * - Uses AppState for flush instead of visibilitychange
 */
export async function initOtelNative(options: OtelOptions): Promise<OtelHandle> {
  if (initialized) {
    console.warn('[@raccoon.ninja/otel-react] initOtelNative() has already been called. Skipping.');
    return {
      shutdown: async () => {
        /* noop */
      },
    };
  }

  validateOptions(options);

  const resource = buildResource(options);
  const endpoint = resolveEndpoint(options);
  const timeout = resolveExportTimeout(options);

  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
    headers: options.headers,
    timeoutMillis: timeout,
  });

  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });

  // BasicTracerProvider doesn't have register(), use the API directly
  trace.setGlobalTracerProvider(tracerProvider);

  const loggerProvider = createLoggerProvider(options, resource);
  const meterProvider = createMeterProvider(options, resource);

  // Listen for AppState changes for flush (React Native)
  let appStateSubscription: { remove: () => void } | null = null;
  try {
    // Dynamic import of AppState so this module doesn't crash in non-RN environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppState } = require('react-native') as {
      AppState: {
        addEventListener: (
          type: string,
          handler: (state: string) => void,
        ) => { remove: () => void };
      };
    };
    appStateSubscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'background' || nextState === 'inactive') {
        tracerProvider.forceFlush();
        loggerProvider.forceFlush();
        meterProvider.forceFlush();
      }
    });
  } catch {
    // AppState not available — skip
  }

  const logger = loggerProvider.getLogger('@raccoon.ninja/otel-react', '1.0.0');
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: `OpenTelemetry (RN) initialized for service "${options.serviceName}"`,
  });

  initialized = true;

  return {
    shutdown: async () => {
      appStateSubscription?.remove();
      await Promise.all([
        tracerProvider.forceFlush(),
        loggerProvider.forceFlush(),
        meterProvider.forceFlush(),
      ]);
      await Promise.all([
        tracerProvider.shutdown(),
        loggerProvider.shutdown(),
        meterProvider.shutdown(),
      ]);
      initialized = false;
    },
  };
}
