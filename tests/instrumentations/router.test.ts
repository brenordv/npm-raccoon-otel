import { describe, it, expect, vi } from 'vitest';

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(),
  },
}));

import { trace } from '@opentelemetry/api';
import { withReactRouter } from '../../src/instrumentations/router';
import type { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

describe('withReactRouter', () => {
  it('returns an extension function', () => {
    const ext = withReactRouter();
    expect(typeof ext).toBe('function');
  });

  it('registers a tracer when called', () => {
    const ext = withReactRouter();
    ext({ tracerProvider: {} as WebTracerProvider });

    expect(trace.getTracer).toHaveBeenCalledWith('@raccoon.ninja/otel-react/router', '1.0.0');
  });
});
