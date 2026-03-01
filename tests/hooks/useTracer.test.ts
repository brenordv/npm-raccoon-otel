import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({ startSpan: vi.fn() }),
  },
}));

import { trace } from '@opentelemetry/api';
import { useTracer } from '../../src/hooks/useTracer';

describe('useTracer', () => {
  it('returns a tracer with default name', () => {
    const { result } = renderHook(() => useTracer());

    expect(trace.getTracer).toHaveBeenCalledWith('@raccoon.ninja/otel-react/custom', undefined);
    expect(result.current).toBeDefined();
    expect(result.current.startSpan).toBeDefined();
  });

  it('returns a tracer with custom name and version', () => {
    renderHook(() => useTracer('my-tracer', '2.0.0'));

    expect(trace.getTracer).toHaveBeenCalledWith('my-tracer', '2.0.0');
  });

  it('memoizes the tracer for same inputs', () => {
    const { result, rerender } = renderHook(() => useTracer('stable-tracer'));

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});
