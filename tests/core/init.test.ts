import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all OTel SDK modules before importing init
vi.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: vi.fn().mockImplementation(() => ({
    register: vi.fn(),
    forceFlush: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@opentelemetry/sdk-trace-base', () => ({
  BatchSpanProcessor: vi.fn(),
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn(),
}));

vi.mock('@opentelemetry/sdk-logs', () => ({
  LoggerProvider: vi.fn().mockImplementation(() => ({
    getLogger: vi.fn().mockReturnValue({ emit: vi.fn() }),
    addLogRecordProcessor: vi.fn(),
    forceFlush: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
  BatchLogRecordProcessor: vi.fn(),
}));

vi.mock('@opentelemetry/exporter-logs-otlp-http', () => ({
  OTLPLogExporter: vi.fn(),
}));

vi.mock('@opentelemetry/sdk-metrics', () => ({
  MeterProvider: vi.fn().mockImplementation(() => ({
    forceFlush: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
  PeriodicExportingMetricReader: vi.fn(),
}));

vi.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: vi.fn(),
}));

vi.mock('@opentelemetry/api', () => ({
  metrics: {
    setGlobalMeterProvider: vi.fn(),
    getMeter: vi.fn().mockReturnValue({
      createHistogram: vi.fn().mockReturnValue({ record: vi.fn() }),
    }),
  },
  trace: {
    getTracer: vi.fn(),
  },
}));

vi.mock('@opentelemetry/api-logs', () => ({
  logs: {
    setGlobalLoggerProvider: vi.fn(),
    getLogger: vi.fn().mockReturnValue({ emit: vi.fn() }),
  },
  SeverityNumber: { INFO: 9, ERROR: 17 },
}));

vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: vi.fn().mockReturnValue({ attributes: {} }),
}));

vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
}));

vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-xml-http-request', () => ({
  XMLHttpRequestInstrumentation: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-user-interaction', () => ({
  UserInteractionInstrumentation: vi.fn(),
}));

vi.mock('web-vitals', () => ({
  onLCP: vi.fn(),
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onTTFB: vi.fn(),
  onFCP: vi.fn(),
}));

import { initOtel, _resetInitState } from '../../src/core/init';

describe('initOtel', () => {
  beforeEach(() => {
    _resetInitState();
    vi.clearAllMocks();
  });

  it('returns a handle with shutdown function', () => {
    const handle = initOtel({ serviceName: 'test-app' });
    expect(handle).toBeDefined();
    expect(typeof handle.shutdown).toBe('function');
  });

  it('throws on invalid serviceName', () => {
    expect(() => initOtel({ serviceName: '' })).toThrow('serviceName is required');
  });

  it('warns and skips on double initialization', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    initOtel({ serviceName: 'test-app' });
    initOtel({ serviceName: 'test-app-2' });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already been called'));

    warnSpy.mockRestore();
  });

  it('calls extensions during initialization', () => {
    const extension = vi.fn();
    initOtel({ serviceName: 'test-app', extensions: [extension] });
    expect(extension).toHaveBeenCalledTimes(1);
    expect(extension).toHaveBeenCalledWith(
      expect.objectContaining({ tracerProvider: expect.anything() }),
    );
  });

  it('shutdown resets initialization state', async () => {
    const handle = initOtel({ serviceName: 'test-app' });
    await handle.shutdown();

    // Should be able to init again after shutdown
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle2 = initOtel({ serviceName: 'test-app-2' });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(handle2).toBeDefined();
    warnSpy.mockRestore();
  });
});
