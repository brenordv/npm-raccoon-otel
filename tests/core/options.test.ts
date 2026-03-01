import { describe, it, expect } from 'vitest';
import {
  validateOptions,
  resolveEndpoint,
  resolveExportTimeout,
  resolveInstrumentations,
} from '../../src/core/options';
import type { OtelOptions } from '../../src/core/options';

const validOptions: OtelOptions = {
  serviceName: 'test-service',
};

describe('validateOptions', () => {
  it('accepts valid minimal options', () => {
    expect(() => validateOptions(validOptions)).not.toThrow();
  });

  it('accepts valid full options', () => {
    expect(() =>
      validateOptions({
        serviceName: 'test-service',
        endpoint: 'http://collector:4318',
        serviceVersion: '1.0.0',
        environment: 'test',
        exportTimeout: 5000,
        headers: { 'x-api-key': 'test' },
        resourceAttributes: { team: 'platform' },
      }),
    ).not.toThrow();
  });

  it('throws if serviceName is empty', () => {
    expect(() => validateOptions({ serviceName: '' })).toThrow('serviceName is required');
  });

  it('throws if serviceName has leading whitespace', () => {
    expect(() => validateOptions({ serviceName: ' test' })).toThrow(
      'leading or trailing whitespace',
    );
  });

  it('throws if serviceName has trailing whitespace', () => {
    expect(() => validateOptions({ serviceName: 'test ' })).toThrow(
      'leading or trailing whitespace',
    );
  });

  it('throws if endpoint is empty string', () => {
    expect(() => validateOptions({ serviceName: 'test', endpoint: '' })).toThrow(
      'endpoint must be a non-empty string',
    );
  });

  it('throws if endpoint is whitespace only', () => {
    expect(() => validateOptions({ serviceName: 'test', endpoint: '  ' })).toThrow(
      'endpoint must be a non-empty string',
    );
  });

  it('throws if exportTimeout is zero', () => {
    expect(() => validateOptions({ serviceName: 'test', exportTimeout: 0 })).toThrow(
      'exportTimeout must be a positive number',
    );
  });

  it('throws if exportTimeout is negative', () => {
    expect(() => validateOptions({ serviceName: 'test', exportTimeout: -1 })).toThrow(
      'exportTimeout must be a positive number',
    );
  });
});

describe('resolveEndpoint', () => {
  it('returns default endpoint when not specified', () => {
    expect(resolveEndpoint(validOptions)).toBe('http://localhost:4318');
  });

  it('returns custom endpoint when specified', () => {
    expect(resolveEndpoint({ ...validOptions, endpoint: 'http://custom:4318' })).toBe(
      'http://custom:4318',
    );
  });
});

describe('resolveExportTimeout', () => {
  it('returns default timeout when not specified', () => {
    expect(resolveExportTimeout(validOptions)).toBe(30000);
  });

  it('returns custom timeout when specified', () => {
    expect(resolveExportTimeout({ ...validOptions, exportTimeout: 5000 })).toBe(5000);
  });
});

describe('resolveInstrumentations', () => {
  it('enables all instrumentations by default', () => {
    const result = resolveInstrumentations(validOptions);
    expect(result).toEqual({
      fetch: true,
      xhr: true,
      documentLoad: true,
      userInteraction: true,
      webVitals: true,
    });
  });

  it('respects individual overrides', () => {
    const result = resolveInstrumentations({
      ...validOptions,
      instrumentations: { fetch: false, webVitals: false },
    });
    expect(result.fetch).toBe(false);
    expect(result.xhr).toBe(true);
    expect(result.webVitals).toBe(false);
  });
});
