import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: vi.fn().mockImplementation(function (this: Record<string, unknown>, config: unknown) {
    this.type = 'fetch';
    this.config = config;
  }),
}));

vi.mock('@opentelemetry/instrumentation-xml-http-request', () => ({
  XMLHttpRequestInstrumentation: vi.fn().mockImplementation(function (this: Record<string, unknown>, config: unknown) {
    this.type = 'xhr';
    this.config = config;
  }),
}));

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.type = 'document-load';
  }),
}));

vi.mock('@opentelemetry/instrumentation-user-interaction', () => ({
  UserInteractionInstrumentation: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.type = 'user-interaction';
  }),
}));

import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerAutoInstrumentations } from '../../src/instrumentations/auto';

describe('registerAutoInstrumentations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers all instrumentations by default', () => {
    registerAutoInstrumentations({ serviceName: 'test' });

    expect(registerInstrumentations).toHaveBeenCalledTimes(1);
    const call = vi.mocked(registerInstrumentations).mock.calls[0][0];
    expect(call.instrumentations).toHaveLength(4);
  });

  it('respects disabled instrumentations', () => {
    registerAutoInstrumentations({
      serviceName: 'test',
      instrumentations: { fetch: false, xhr: false },
    });

    expect(registerInstrumentations).toHaveBeenCalledTimes(1);
    const call = vi.mocked(registerInstrumentations).mock.calls[0][0];
    expect(call.instrumentations).toHaveLength(2);
  });

  it('does not call registerInstrumentations when all disabled', () => {
    registerAutoInstrumentations({
      serviceName: 'test',
      instrumentations: {
        fetch: false,
        xhr: false,
        documentLoad: false,
        userInteraction: false,
      },
    });

    expect(registerInstrumentations).not.toHaveBeenCalled();
  });

  it('passes ignoreUrls to fetch and xhr instrumentations', () => {
    registerAutoInstrumentations({
      serviceName: 'test',
      ignoreUrls: [/health/, '/analytics'],
    });

    // User-provided ignoreUrls are preserved, plus the auto-appended OTEL endpoint regex
    const fetchCall = vi.mocked(FetchInstrumentation).mock.calls[0][0] as {
      ignoreUrls: Array<string | RegExp>;
    };
    expect(fetchCall.ignoreUrls).toHaveLength(3);
    expect(fetchCall.ignoreUrls[0]).toEqual(/health/);
    expect(fetchCall.ignoreUrls[1]).toBe('/analytics');
    expect(fetchCall.ignoreUrls[2]).toBeInstanceOf(RegExp);

    const xhrCall = vi.mocked(XMLHttpRequestInstrumentation).mock.calls[0][0] as {
      ignoreUrls: Array<string | RegExp>;
    };
    expect(xhrCall.ignoreUrls).toHaveLength(3);
    expect(xhrCall.ignoreUrls[0]).toEqual(/health/);
    expect(xhrCall.ignoreUrls[1]).toBe('/analytics');
    expect(xhrCall.ignoreUrls[2]).toBeInstanceOf(RegExp);
  });

  it('automatically adds the OTEL endpoint to ignoreUrls', () => {
    const endpoint = 'http://otel.example.com:4318';
    registerAutoInstrumentations({
      serviceName: 'test',
      endpoint,
    });

    const fetchCall = vi.mocked(FetchInstrumentation).mock.calls[0][0] as {
      ignoreUrls: Array<string | RegExp>;
    };
    expect(fetchCall.ignoreUrls).toHaveLength(1);
    const endpointRegex = fetchCall.ignoreUrls[0] as RegExp;
    expect(endpointRegex).toBeInstanceOf(RegExp);
    expect(endpointRegex.test('http://otel.example.com:4318/v1/traces')).toBe(true);
    expect(endpointRegex.test('http://other.example.com/api')).toBe(false);
  });

  it('passes propagateTraceHeaderCorsUrls to fetch and xhr instrumentations', () => {
    registerAutoInstrumentations({
      serviceName: 'test',
      propagateTraceHeaderCorsUrls: [/api\.example\.com/, 'https://backend.local'],
    });

    expect(FetchInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        propagateTraceHeaderCorsUrls: [/api\.example\.com/, 'https://backend.local'],
      }),
    );
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        propagateTraceHeaderCorsUrls: [/api\.example\.com/, 'https://backend.local'],
      }),
    );
  });

  it('defaults propagateTraceHeaderCorsUrls to empty array when not provided', () => {
    registerAutoInstrumentations({ serviceName: 'test' });

    expect(FetchInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        propagateTraceHeaderCorsUrls: [],
      }),
    );
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        propagateTraceHeaderCorsUrls: [],
      }),
    );
  });
});
