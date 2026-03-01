import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setStatus: vi.fn(),
    setAttribute: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  };
  return {
    trace: {
      getTracer: vi.fn().mockReturnValue({
        startSpan: vi.fn().mockReturnValue(mockSpan),
      }),
    },
    SpanStatusCode: { ERROR: 2 },
    __mockSpan: mockSpan,
  };
});

vi.mock('@opentelemetry/api-logs', () => ({
  logs: {
    getLogger: vi.fn().mockReturnValue({
      emit: vi.fn(),
    }),
  },
  SeverityNumber: { ERROR: 17 },
}));

import { trace } from '@opentelemetry/api';
import { TracedErrorBoundary } from '../../src/components/TracedErrorBoundary';

function ThrowingComponent({ error }: { error: Error }) {
  throw error;
}

// Access the mock span through the mocked module
function getMockSpan() {
  const tracer = trace.getTracer('test');
  return tracer.startSpan('test');
}

describe('TracedErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress React error boundary console output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <TracedErrorBoundary fallback={<div>Error</div>}>
        <div data-testid="child">OK</div>
      </TracedErrorBoundary>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('OK');
  });

  it('renders fallback ReactNode on error', () => {
    const error = new Error('Test error');

    render(
      <TracedErrorBoundary fallback={<div data-testid="fallback">Something went wrong</div>}>
        <ThrowingComponent error={error} />
      </TracedErrorBoundary>,
    );

    expect(screen.getByTestId('fallback')).toHaveTextContent('Something went wrong');
  });

  it('renders fallback function on error', () => {
    const error = new Error('Test error');

    render(
      <TracedErrorBoundary
        fallback={(err, _reset) => <div data-testid="fallback">{err.message}</div>}
      >
        <ThrowingComponent error={error} />
      </TracedErrorBoundary>,
    );

    expect(screen.getByTestId('fallback')).toHaveTextContent('Test error');
  });

  it('records error as a span', () => {
    const error = new Error('Test error');

    render(
      <TracedErrorBoundary fallback={<div>Error</div>}>
        <ThrowingComponent error={error} />
      </TracedErrorBoundary>,
    );

    const tracer = trace.getTracer('test');
    expect(tracer.startSpan).toHaveBeenCalled();
    const span = getMockSpan();
    expect(span.setStatus).toHaveBeenCalled();
    expect(span.recordException).toHaveBeenCalled();
    expect(span.end).toHaveBeenCalled();
  });

  it('calls onError callback', () => {
    const error = new Error('Test error');
    const onError = vi.fn();

    render(
      <TracedErrorBoundary fallback={<div>Error</div>} onError={onError}>
        <ThrowingComponent error={error} />
      </TracedErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({}));
  });
});
