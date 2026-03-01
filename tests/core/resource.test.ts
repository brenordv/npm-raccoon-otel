import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildResource } from '../../src/core/resource';

describe('buildResource', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        language: 'en-US',
        userAgent: 'TestAgent/1.0',
        platform: 'TestPlatform',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('sets service.name from options', () => {
    const resource = buildResource({ serviceName: 'my-service' });
    expect(resource.attributes['service.name']).toBe('my-service');
  });

  it('sets SDK attributes', () => {
    const resource = buildResource({ serviceName: 'test' });
    expect(resource.attributes['telemetry.sdk.name']).toBe('@raccoon.ninja/otel-react');
    expect(resource.attributes['telemetry.sdk.version']).toBe('1.0.0');
    expect(resource.attributes['telemetry.sdk.language']).toBe('webjs');
  });

  it('sets service.version when provided', () => {
    const resource = buildResource({ serviceName: 'test', serviceVersion: '2.0.0' });
    expect(resource.attributes['service.version']).toBe('2.0.0');
  });

  it('sets deployment.environment.name when provided', () => {
    const resource = buildResource({ serviceName: 'test', environment: 'production' });
    expect(resource.attributes['deployment.environment']).toBe('production');
  });

  it('includes browser attributes from navigator', () => {
    const resource = buildResource({ serviceName: 'test' });
    expect(resource.attributes['browser.language']).toBe('en-US');
    expect(resource.attributes['browser.user_agent']).toBe('TestAgent/1.0');
    expect(resource.attributes['browser.platform']).toBe('TestPlatform');
  });

  it('includes custom resource attributes', () => {
    const resource = buildResource({
      serviceName: 'test',
      resourceAttributes: { team: 'platform', region: 'us-east-1' },
    });
    expect(resource.attributes['team']).toBe('platform');
    expect(resource.attributes['region']).toBe('us-east-1');
  });

  it('custom attributes override defaults', () => {
    const resource = buildResource({
      serviceName: 'test',
      resourceAttributes: { 'telemetry.sdk.version': '99.0.0' },
    });
    expect(resource.attributes['telemetry.sdk.version']).toBe('99.0.0');
  });
});
