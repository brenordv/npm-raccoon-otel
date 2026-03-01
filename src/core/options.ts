import type { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import type { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

/** Configuration for enabling/disabling specific auto-instrumentations. */
export interface InstrumentationConfig {
  /** Auto-instrument fetch() calls. Default: true */
  fetch?: boolean;
  /** Auto-instrument XMLHttpRequest. Default: true */
  xhr?: boolean;
  /** Document load timing spans. Default: true */
  documentLoad?: boolean;
  /** Click/input interaction spans. Default: true */
  userInteraction?: boolean;
  /** LCP, CLS, INP, TTFB, FCP metrics. Default: true */
  webVitals?: boolean;
}

/** Extension function type for opt-in instrumentations (e.g., withReactRouter). */
export type OtelExtension = (context: ExtensionContext) => void;

/** Context provided to extension functions during initialization. */
export interface ExtensionContext {
  tracerProvider: WebTracerProvider;
}

/** Configuration options for initOtel(). */
export interface OtelOptions {
  /** Required. Sets the service.name resource attribute. */
  serviceName: string;

  /** OTLP HTTP endpoint. Default: 'http://localhost:4318' */
  endpoint?: string;

  /** Additional OTel resource attributes. */
  resourceAttributes?: Record<string, string>;

  /** Service version. Sets service.version resource attribute. */
  serviceVersion?: string;

  /** Deployment environment. Sets deployment.environment resource attribute. */
  environment?: string;

  /** Enable/disable specific auto-instrumentations. All enabled by default. */
  instrumentations?: InstrumentationConfig;

  /** Escape hatch: configure the TracerProvider before it's registered. */
  configureTracing?: (provider: WebTracerProvider) => void;

  /** Escape hatch: configure the OTLP exporter. */
  configureExporter?: (exporter: OTLPTraceExporter) => void;

  /** Custom headers sent with OTLP export requests (e.g., auth tokens). */
  headers?: Record<string, string>;

  /** Export timeout in milliseconds. Default: 30000 */
  exportTimeout?: number;

  /**
   * URLs to exclude from fetch/XHR instrumentation.
   * Supports string patterns or RegExp.
   */
  ignoreUrls?: Array<string | RegExp>;

  /** Extension functions for opt-in instrumentations. */
  extensions?: OtelExtension[];
}

/** Handle returned from initOtel() for lifecycle management. */
export interface OtelHandle {
  /** Flush all pending telemetry and shut down providers. */
  shutdown: () => Promise<void>;
}

const DEFAULT_ENDPOINT = 'http://localhost:4318';
const DEFAULT_EXPORT_TIMEOUT = 30000;

export function resolveEndpoint(options: OtelOptions): string {
  return options.endpoint ?? DEFAULT_ENDPOINT;
}

export function resolveExportTimeout(options: OtelOptions): number {
  return options.exportTimeout ?? DEFAULT_EXPORT_TIMEOUT;
}

export function resolveInstrumentations(options: OtelOptions): Required<InstrumentationConfig> {
  return {
    fetch: options.instrumentations?.fetch ?? true,
    xhr: options.instrumentations?.xhr ?? true,
    documentLoad: options.instrumentations?.documentLoad ?? true,
    userInteraction: options.instrumentations?.userInteraction ?? true,
    webVitals: options.instrumentations?.webVitals ?? true,
  };
}

export function validateOptions(options: OtelOptions): void {
  if (!options.serviceName || typeof options.serviceName !== 'string') {
    throw new Error(
      '[@raccoon.ninja/otel-react] serviceName is required and must be a non-empty string.',
    );
  }

  if (options.serviceName.trim() !== options.serviceName) {
    throw new Error(
      '[@raccoon.ninja/otel-react] serviceName must not have leading or trailing whitespace.',
    );
  }

  if (options.endpoint !== undefined) {
    if (typeof options.endpoint !== 'string' || options.endpoint.trim() === '') {
      throw new Error(
        '[@raccoon.ninja/otel-react] endpoint must be a non-empty string when provided.',
      );
    }
  }

  if (options.exportTimeout !== undefined) {
    if (typeof options.exportTimeout !== 'number' || options.exportTimeout <= 0) {
      throw new Error(
        '[@raccoon.ninja/otel-react] exportTimeout must be a positive number when provided.',
      );
    }
  }
}
