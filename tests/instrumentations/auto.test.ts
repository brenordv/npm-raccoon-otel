import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: vi.fn(),
}));

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: vi.fn().mockImplementation((config) => ({
    type: 'fetch',
    config,
  })),
}));

vi.mock('@opentelemetry/instrumentation-xml-http-request', () => ({
  XMLHttpRequestInstrumentation: vi.fn().mockImplementation((config) => ({
    type: 'xhr',
    config,
  })),
}));

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: vi.fn().mockImplementation(() => ({
    type: 'document-load',
  })),
}));

vi.mock('@opentelemetry/instrumentation-user-interaction', () => ({
  UserInteractionInstrumentation: vi.fn().mockImplementation(() => ({
    type: 'user-interaction',
  })),
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

    expect(FetchInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        ignoreUrls: [/health/, '/analytics'],
      }),
    );
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({
        ignoreUrls: [/health/, '/analytics'],
      }),
    );
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
