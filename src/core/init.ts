import { SeverityNumber } from '@opentelemetry/api-logs';
import type { OtelOptions, OtelHandle } from './options';
import { validateOptions, resolveInstrumentations } from './options';
import { buildResource } from './resource';
import { createTracerProvider } from '../providers/tracer';
import { createLoggerProvider } from '../providers/logger';
import { createMeterProvider } from '../providers/meter';
import { registerAutoInstrumentations } from '../instrumentations/auto';
import { startWebVitalsCollection } from '../instrumentations/web-vitals';
import { registerShutdownTargets, shutdown } from './shutdown';

let initialized = false;

export function initOtel(options: OtelOptions): OtelHandle {
  if (initialized) {
    console.warn(
      '[@raccoon.ninja/otel-react] initOtel() has already been called. Skipping re-initialization.',
    );
    return { shutdown };
  }

  validateOptions(options);

  const resource = buildResource(options);
  const { provider: tracerProvider } = createTracerProvider(options, resource);
  const loggerProvider = createLoggerProvider(options, resource);
  const meterProvider = createMeterProvider(options, resource);

  registerAutoInstrumentations(options);

  const instrumentationConfig = resolveInstrumentations(options);
  if (instrumentationConfig.webVitals) {
    startWebVitalsCollection();
  }

  registerShutdownTargets({ tracerProvider, loggerProvider, meterProvider });

  // Run extensions
  if (options.extensions) {
    for (const ext of options.extensions) {
      ext({ tracerProvider });
    }
  }

  // Log initialization success
  const logger = loggerProvider.getLogger('@raccoon.ninja/otel-react', '1.0.0');
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: `OpenTelemetry initialized for service "${options.serviceName}"`,
    attributes: {
      'otel.service_name': options.serviceName,
    },
  });

  initialized = true;

  return {
    shutdown: async () => {
      await shutdown();
      initialized = false;
    },
  };
}

/** Reset initialization state (for testing). */
export function _resetInitState(): void {
  initialized = false;
}
